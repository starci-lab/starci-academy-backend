import {
    Injectable,
} from "@nestjs/common"
import {
    CreateBucketCommand,
    HeadBucketCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3"
import {
    ToolsArtifactNotFoundException,
    ToolsArtifactSyncTargetsMissingException,
} from "@modules/platform/exceptions/errors/tools/artifact"
import type {
    S3Client,
} from "@aws-sdk/client-s3"
import {
    createReadStream,
} from "fs"
import {
    readdir,
    stat,
} from "fs/promises"
import {
    join,
    relative,
    sep,
} from "path"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ArtifactStatus,
} from "../store/enums/store"
import {
    ToolsStoreService,
} from "../store/tools-store.service"
import {
    buildS3Client,
    contentTypeForKey,
} from "../utils/s3-target"
import type {
    PushResult,
    PushToTargetParams,
    SyncArtifactResult,
    SyncFileEntry,
    SyncTargetResult,
} from "./types/sync"

@Injectable()
/**
 * Pushes local artifacts up to a saved S3 target.
 *
 * This is the "sync to cloud" half of the local-first flow: a build tool writes
 * an artifact to disk and registers it, then this service uploads every file to
 * the target bucket. Because the local artifact is kept, the same push can be
 * re-run later ({@link syncArtifact}) without recomputing it -- a re-PUT simply
 * overwrites the object.
 */
export class SyncService {
    constructor(
        private readonly toolsStoreService: ToolsStoreService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Upload every file under `localPath` to the target bucket below `keyPrefix`.
     *
     * @param params - The local path, destination target and key prefix.
     * @returns The number of files/bytes uploaded and the keys written.
     */
    async pushToTarget(
        {
            localPath,
            target,
            keyPrefix,
        }: PushToTargetParams,
    ): Promise<PushResult> {
        // build an ephemeral client scoped to this target's remote server
        const client = buildS3Client(target)

        // make sure the destination bucket exists before any PutObject
        await this.ensureBucket(client,
            target.bucket)

        // resolve the artifact into a flat list of {absolute file, relative key}
        const entries = await this.collectFiles(localPath)

        // strip any trailing slash so we never produce a double "//" in keys
        const prefix = keyPrefix.replace(/\/+$/,
            "")

        let bytes = 0
        const keys: Array<string> = []
        for (const entry of entries) {
            // POSIX-style key even on Windows (S3 keys use "/")
            const key = `${prefix}/${entry.relativeKey.split(sep).join("/")}`
            await client.send(
                new PutObjectCommand({
                    Bucket: target.bucket,
                    Key: key,
                    Body: createReadStream(entry.absolutePath),
                    ContentType: contentTypeForKey(key),
                }),
            )
            bytes += entry.size
            keys.push(key)
        }

        return {
            files: entries.length,
            bytes,
            keys,
        }
    }

    /**
     * (Re-)sync a registered artifact to every configured target.
     *
     * Pushes the kept local artifact to each target independently -- one failing
     * target does not abort the others. The artifact is marked `synced` only
     * when every target succeeds, else `error` (it stays on disk for a retry).
     *
     * @param artifactId - The artifact to push.
     * @returns The new status, totals, and a per-target breakdown.
     * @throws ToolsArtifactNotFoundException When the artifact does not exist.
     * @throws ToolsArtifactSyncTargetsMissingException When the artifact has no targets/key prefix.
     */
    async syncArtifact(artifactId: string): Promise<SyncArtifactResult> {
        // the artifact must exist to be synced
        const artifact = this.toolsStoreService.getArtifact(artifactId)
        if (!artifact) {
            throw new ToolsArtifactNotFoundException({
                artifactId,
            })
        }
        // a sync needs at least one destination + a key prefix
        if (artifact.targetIds.length === 0 || !artifact.keyPrefix) {
            throw new ToolsArtifactSyncTargetsMissingException({
                artifactId,
            })
        }

        const keyPrefix = artifact.keyPrefix
        const targets: Array<SyncTargetResult> = []
        let totalBytes = 0
        let firstFiles = 0

        // push to each target independently, collecting per-target outcomes
        for (const targetId of artifact.targetIds) {
            const target = this.toolsStoreService.getTarget(targetId)
            if (!target) {
                // a deleted target is a soft failure for this artifact
                targets.push({
                    targetId,
                    targetName: targetId,
                    ok: false,
                    files: 0,
                    bytes: 0,
                    error: "target no longer exists",
                })
                continue
            }
            try {
                const result = await this.pushToTarget({
                    localPath: artifact.localPath,
                    target,
                    keyPrefix,
                })
                totalBytes += result.bytes
                // the representative file count is the first successful target's
                if (firstFiles === 0) {
                    firstFiles = result.files
                }
                targets.push({
                    targetId,
                    targetName: target.name,
                    ok: true,
                    files: result.files,
                    bytes: result.bytes,
                })
                this.winstonService.log(WinstonLog.ToolsOperationCompleted,
                    {
                        op: "tools.sync.completed",
                        count: result.files,
                        meta: {
                            artifactId,
                            targetName: target.name,
                            bytes: result.bytes,
                        },
                    })
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                this.winstonService.log(WinstonLog.ToolsOperationFailed,
                    {
                        op: "tools.sync.failed",
                        error: message,
                        meta: {
                            artifactId,
                            targetName: target.name,
                        },
                    })
                targets.push({
                    targetId,
                    targetName: target.name,
                    ok: false,
                    files: 0,
                    bytes: 0,
                    error: message,
                })
            }
        }

        // synced only when every target succeeded
        const allOk = targets.every((t) => t.ok)
        const status = allOk ? ArtifactStatus.Synced : ArtifactStatus.Error
        this.toolsStoreService.updateArtifactSync({
            id: artifactId,
            status,
            bytes: totalBytes,
            syncedAt: allOk ? Date.now() : undefined,
        })

        return {
            artifactId,
            status,
            files: firstFiles,
            bytes: totalBytes,
            targets,
        }
    }

    /**
     * Ensure a bucket exists on the target, creating it on first use.
     *
     * Lets the operator point at a fresh prod bucket without pre-creating it.
     */
    private async ensureBucket(client: S3Client, bucket: string): Promise<void> {
        try {
            // cheap existence probe
            await client.send(new HeadBucketCommand({
                Bucket: bucket,
            }))
        } catch {
            // missing (or no head permission) -> try to create; ignore "already
            // owned" races so concurrent syncs don't fight
            try {
                await client.send(new CreateBucketCommand({
                    Bucket: bucket,
                }))
                this.winstonService.log(WinstonLog.ToolsOperationCompleted,
                    {
                        op: "tools.sync.bucket-created",
                        meta: {
                            bucket,
                        },
                    })
            } catch (error) {
                const name = error instanceof Error ? error.name : ""
                if (name !== "BucketAlreadyOwnedByYou" && name !== "BucketAlreadyExists") {
                    throw error
                }
            }
        }
    }

    /**
     * Resolve a path (file or directory) into a flat list of files to upload.
     *
     * @returns Each file's absolute path, its key relative to the root, and size.
     */
    private async collectFiles(
        rootPath: string,
    ): Promise<Array<SyncFileEntry>> {
        const rootStat = await stat(rootPath)

        // a single file uploads under its own basename
        if (rootStat.isFile()) {
            return [{
                absolutePath: rootPath,
                relativeKey: rootPath.split(sep).pop() ?? "file",
                size: rootStat.size,
            }]
        }

        // a directory uploads every nested file, mirroring its tree as keys
        const out: Array<SyncFileEntry> = []
        const walk = async (dir: string): Promise<void> => {
            const dirents = await readdir(dir,
                {
                    withFileTypes: true,
                })
            for (const dirent of dirents) {
                const abs = join(dir,
                    dirent.name)
                if (dirent.isDirectory()) {
                    await walk(abs)
                    continue
                }
                const { size } = await stat(abs)
                out.push({
                    absolutePath: abs,
                    relativeKey: relative(rootPath,
                        abs),
                    size,
                })
            }
        }
        await walk(rootPath)
        return out
    }
}
