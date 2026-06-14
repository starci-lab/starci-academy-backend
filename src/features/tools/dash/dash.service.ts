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
    Bento4Service,
} from "@modules/bento4"
import {
    ArtifactType,
    ToolsStoreService,
} from "../store"
import {
    SyncService,
} from "../sync"
import type {
    ProcessDashParams,
    ProcessDashResult,
} from "./types"

/**
 * Encodes an uploaded video to MPEG-DASH locally, registers it as an artifact,
 * and (optionally) syncs it to a saved S3 target.
 *
 * Flow (local-first): write source → multi-bitrate encode (local CPU/GPU) →
 * fragment each rendition (Bento4) → generate the DASH manifest → register the
 * whole working directory as a kept artifact → push to the target. The artifact
 * stays on disk so it can be re-synced later without re-encoding.
 */
@Injectable()
export class DashService {
    private readonly logger = new Logger(DashService.name)

    constructor(
        private readonly ffmpegService: FfmpegService,
        private readonly bento4Service: Bento4Service,
        private readonly toolsStoreService: ToolsStoreService,
        private readonly syncService: SyncService,
    ) {}

    /**
     * Produce a DASH artifact and optionally sync it to a target.
     *
     * @param params - The uploaded file, optional target id and key prefix.
     * @returns The artifact id, its local path, the manifest key and sync result.
     */
    async execute(
        {
            file,
            targetIds,
            keyPrefix,
        }: ProcessDashParams,
    ): Promise<ProcessDashResult> {
        // the multipart `file` field is required
        if (!file) {
            throw new BadRequestException("No file uploaded (expected multipart field \"file\").")
        }
        // validate every requested target up-front so we fail before encoding
        for (const targetId of targetIds) {
            if (!this.toolsStoreService.getTarget(targetId)) {
                throw new BadRequestException(`Target ${targetId} not found.`)
            }
        }

        // persistent working dir under the snapshot root (kept as the artifact)
        const id = randomUUID()
        const workDir = join(
            envConfig().tools.snapshotDir,
            "dash",
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

        // multi-bitrate encode → 1080/720/480/360.mp4 in the working dir
        await this.ffmpegService.encodeAtMultipleBitrates(workDir,
            sourceName)

        // fragment each rendition when needed (our encodes are non-fragmented),
        // mirroring the production package step
        const videoNames = this.ffmpegService.videoNames
        for (const videoName of videoNames) {
            const fragmentationRequired = await this.bento4Service.checkFragments(workDir,
                videoName)
            if (fragmentationRequired) {
                await this.bento4Service.fragmentVideo(workDir,
                    videoName)
            }
        }
        // package the fragments into a DASH manifest (manifest.mpd + segments)
        await this.bento4Service.generateMpegDashManifestFromFragments(workDir,
            videoNames)

        // register the kept artifact; default key prefix namespaces by id
        const resolvedPrefix = (keyPrefix ?? `dash/${id}`).replace(/\/+$/,
            "")
        const artifact = this.toolsStoreService.createArtifact({
            type: ArtifactType.Dash,
            label: sourceName,
            localPath: workDir,
            keyPrefix: resolvedPrefix,
            targetIds,
            meta: {
                renditions: videoNames,
            },
        })

        this.logger.log(`Built DASH artifact ${artifact.id} at ${workDir}`)

        // sync to cloud only when at least one target was provided
        const synced = targetIds.length > 0
            ? await this.syncService.syncArtifact(artifact.id)
            : null

        return {
            artifactId: artifact.id,
            localPath: workDir,
            manifestKey: targetIds.length > 0 ? `${resolvedPrefix}/manifest.mpd` : null,
            synced,
        }
    }
}
