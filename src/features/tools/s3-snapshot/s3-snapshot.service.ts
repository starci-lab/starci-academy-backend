import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    GetObjectCommand,
    ListObjectsV2Command,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    createWriteStream,
} from "fs"
import {
    mkdir,
} from "fs/promises"
import {
    pipeline,
} from "stream/promises"
import {
    dirname,
    join,
} from "path"
import {
    Readable,
} from "stream"
import {
    envConfig,
} from "@modules/env"
import {
    ArtifactType,
    ToolsStoreService,
} from "../store"
import type {
    DownloadOneParams,
    S3SnapshotParams,
    S3SnapshotResult,
} from "./types"

@Injectable()
/**
 * Downloads every object of a remote S3-compatible bucket into a local
 * snapshot directory, preserving the key hierarchy as folders.
 *
 * A throwaway {@link S3Client} is built from the per-request credentials because
 * the operator targets an arbitrary remote server — not the app's own MinIO /
 * DigitalOcean clients. The local snapshot can then be inspected or pushed back
 * up to another bucket by hand.
 */
export class S3SnapshotService {
    private readonly logger = new Logger(S3SnapshotService.name)

    constructor(
        private readonly toolsStoreService: ToolsStoreService,
    ) {}

    /**
     * Snapshot the requested bucket/prefix to `<TOOLS_SNAPSHOT_DIR>/s3/<bucket>`.
     *
     * @param params - Endpoint, credentials, bucket and optional prefix.
     * @returns Counts and the local directory the objects were written into.
     */
    async execute(
        {
            endpoint,
            region,
            accessKeyId,
            secretAccessKey,
            bucket,
            prefix,
            forcePathStyle = true,
        }: S3SnapshotParams,
    ): Promise<S3SnapshotResult> {
        // build an ephemeral client scoped to this request's remote server
        const client = new S3Client({
            endpoint,
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            // path-style is the safe default for MinIO and most self-hosts
            forcePathStyle,
        })

        // one directory per bucket under the shared snapshot root
        const directory = join(
            envConfig().tools.snapshotDir,
            "s3",
            bucket,
        )

        let downloaded = 0
        let totalBytes = 0
        const failed: Array<string> = []

        // ListObjectsV2 caps at 1000 keys/page → follow the continuation token
        let continuationToken: string | undefined = undefined
        do {
            const page = await client.send(
                new ListObjectsV2Command({
                    Bucket: bucket,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                }),
            )

            // download each object in this page to a mirrored local path
            for (const object of page.Contents ?? []) {
                // skip entries without a key, and "directory marker" keys (end in /)
                if (!object.Key || object.Key.endsWith("/")) {
                    continue
                }
                try {
                    const bytes = await this.downloadOne({
                        client,
                        bucket,
                        key: object.Key,
                        directory,
                    })
                    downloaded += 1
                    totalBytes += bytes
                } catch (error) {
                    // record the failed key and keep going — one bad object
                    // must not abort a multi-thousand-object snapshot
                    this.logger.error(
                        `Failed to download "${object.Key}": ${error instanceof Error ? error.message : String(error)}`,
                    )
                    failed.push(object.Key)
                }
            }

            // advance only while S3 signals more pages remain
            continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
        } while (continuationToken)

        // register the downloaded mirror as a local artifact (local-only;
        // resync to a different bucket requires assigning a target later)
        const artifact = this.toolsStoreService.createArtifact({
            type: ArtifactType.S3Snapshot,
            label: `${bucket}${prefix ? `/${prefix}` : ""}`,
            localPath: directory,
            meta: {
                bucket,
                prefix: prefix ?? null,
                downloaded,
                totalBytes,
            },
        })

        this.logger.log(
            `Snapshotted bucket "${bucket}" → ${directory} (${downloaded} objects, ${totalBytes} bytes, ${failed.length} failed)`,
        )

        return {
            artifactId: artifact.id,
            directory,
            downloaded,
            failed,
            totalBytes,
        }
    }

    /**
     * Download a single object and stream it to its mirrored local path.
     *
     * @returns The number of bytes written.
     */
    private async downloadOne(
        {
            client,
            bucket,
            key,
            directory,
        }: DownloadOneParams,
    ): Promise<number> {
        // mirror the object key as a relative path under the bucket directory
        const destination = join(directory,
            key)
        // ensure the nested parent folders exist before writing
        await mkdir(
            dirname(destination),
            {
                recursive: true,
            },
        )

        const result = await client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
        )

        const body = result.Body
        if (!body) {
            // an object with no body still counts as written (0 bytes)
            return 0
        }
        if (!(body instanceof Readable)) {
            return 0
        }

        // stream straight to disk so large objects never buffer in memory
        await pipeline(
            body,
            createWriteStream(destination),
        )

        // ContentLength is the authoritative size when present
        return result.ContentLength ?? 0
    }
}
