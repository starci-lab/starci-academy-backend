import {
    Injectable,
} from "@nestjs/common"
import {
    randomUUID,
} from "crypto"
import {
    ToolsFileRequiredException,
    ToolsTargetReferenceInvalidException,
} from "@modules/exceptions"
import {
    mkdir,
    writeFile,
} from "fs/promises"
import {
    join,
} from "path"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ArtifactType,
    ToolsStoreService,
} from "../store"
import {
    SyncService,
} from "../sync"
import type {
    ProcessUploadParams,
    ProcessUploadResult,
    UploadItemResult,
} from "./types"

@Injectable()
/**
 * Uploads raw file(s) as-is to one or more S3 targets.
 *
 * No transcoding: each file is written to a kept local artifact dir, registered,
 * and synced to every chosen target (local + prod MinIO at once). The local copy
 * stays as a cache so the same file can be re-synced later without re-uploading
 * from the operator's browser.
 */
export class UploadService {
    constructor(
        private readonly toolsStoreService: ToolsStoreService,
        private readonly syncService: SyncService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Store and (optionally) sync every uploaded file.
     *
     * @param params - The files, target ids and key prefix.
     * @returns A per-file outcome list.
     */
    async execute(
        {
            files,
            targetIds,
            keyPrefix,
        }: ProcessUploadParams,
    ): Promise<ProcessUploadResult> {
        // at least one file is required
        if (!files || files.length === 0) {
            throw new ToolsFileRequiredException({
                fieldName: "files",
            })
        }
        // validate every requested target up-front so we fail before writing
        for (const targetId of targetIds) {
            if (!this.toolsStoreService.getTarget(targetId)) {
                throw new ToolsTargetReferenceInvalidException({
                    targetId,
                })
            }
        }

        // shared destination prefix for this batch
        const resolvedPrefix = (keyPrefix ?? "uploads").replace(/\/+$/,
            "")
        const items: Array<UploadItemResult> = []

        for (const file of files) {
            // each file gets its own kept artifact directory
            const id = randomUUID()
            const dir = join(
                envConfig().tools.snapshotDir,
                "upload",
                id,
            )
            await mkdir(dir,
                {
                    recursive: true,
                })
            const filename = file.originalname || "file"
            const filePath = join(dir,
                filename)
            // persist the raw bytes unchanged
            await writeFile(filePath,
                file.buffer)

            // register the artifact pointing at the single file so sync uploads
            // it under `<prefix>/<filename>`
            const artifact = this.toolsStoreService.createArtifact({
                type: ArtifactType.Upload,
                label: filename,
                localPath: filePath,
                keyPrefix: resolvedPrefix,
                targetIds,
                meta: {
                    size: file.size,
                    mimetype: file.mimetype,
                },
            })

            this.winstonService.log(WinstonLog.ToolsArtifactBuilt,
                {
                    op: "tools.upload.stored",
                    meta: {
                        filename,
                        artifactId: artifact.id,
                        filePath,
                    },
                })

            // sync to every target when at least one was chosen
            const synced = targetIds.length > 0
                ? await this.syncService.syncArtifact(artifact.id)
                : null

            items.push({
                filename,
                artifactId: artifact.id,
                localPath: filePath,
                synced,
            })
        }

        return {
            items,
        }
    }
}
