import {
    BadRequestException,
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    randomUUID,
} from "crypto"
import {
    mkdir,
    stat,
    writeFile,
} from "fs/promises"
import {
    join,
} from "path"
import {
    envConfig,
} from "@modules/env"
import {
    FfmpegService,
} from "@modules/ffmpeg"
import {
    ArtifactType,
    ToolsStoreService,
} from "../store"
import {
    SyncService,
} from "../sync"
import type {
    MediaRendition,
    ProcessMediaParams,
    ProcessMediaResult,
} from "./types"

/**
 * Encodes an uploaded video into multi-bitrate mp4 renditions locally,
 * registers them as a kept artifact, and (optionally) syncs to a saved S3
 * target.
 *
 * Flow (local-first): write source → multi-bitrate encode on local CPU/GPU →
 * register the working directory as a re-syncable artifact → push to the
 * target. The renditions stay on disk as a cache so the same artifact can be
 * re-synced later without re-encoding.
 */
@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name)

    constructor(
        private readonly ffmpegService: FfmpegService,
        private readonly toolsStoreService: ToolsStoreService,
        private readonly syncService: SyncService,
    ) {}

    /**
     * Encode the uploaded video and optionally sync the renditions to a target.
     *
     * @param params - The uploaded file, optional target id and key prefix.
     * @returns The artifact id, local path, rendition list and sync result.
     */
    async execute(
        {
            file,
            targetIds,
            keyPrefix,
        }: ProcessMediaParams,
    ): Promise<ProcessMediaResult> {
        // the multipart `file` field is required
        if (!file) {
            throw new BadRequestException("No file uploaded (expected multipart field \"file\").")
        }
        // validate every target up-front so we fail before spending CPU on encoding
        for (const targetId of targetIds) {
            if (!this.toolsStoreService.getTarget(targetId)) {
                throw new BadRequestException(`Target ${targetId} not found.`)
            }
        }

        // persistent working dir under the snapshot root (kept as the artifact)
        const id = randomUUID()
        const workDir = join(
            envConfig().tools.snapshotDir,
            "media",
            id,
        )
        await mkdir(workDir,
            {
                recursive: true,
            })

        const sourceName = file.originalname || "source.mp4"
        // persist the upload to disk for ffmpeg to read
        await writeFile(join(workDir,
            sourceName),
        file.buffer)

        // produce 1080/720/480/360 renditions next to the source
        await this.ffmpegService.encodeAtMultipleBitrates(workDir,
            sourceName)

        // collect rendition sizes for the response
        const renditions: Array<MediaRendition> = []
        for (const name of this.ffmpegService.videoNames) {
            const { size } = await stat(join(workDir,
                name))
            renditions.push({
                name,
                sizeBytes: size,
            })
        }

        // register the kept artifact; default key prefix namespaces by id
        const resolvedPrefix = (keyPrefix ?? `media/${id}`).replace(/\/+$/,
            "")
        const artifact = this.toolsStoreService.createArtifact({
            type: ArtifactType.Media,
            label: sourceName,
            localPath: workDir,
            keyPrefix: resolvedPrefix,
            targetIds,
            meta: {
                renditions: renditions.map((r) => r.name),
            },
        })

        this.logger.log(`Built media artifact ${artifact.id} at ${workDir}`)

        // sync to cloud only when at least one target was provided
        const synced = targetIds.length > 0
            ? await this.syncService.syncArtifact(artifact.id)
            : null

        return {
            artifactId: artifact.id,
            localPath: workDir,
            renditions,
            synced,
        }
    }
}
