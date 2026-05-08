import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import {
    JobExtendedContext,
} from "../types"
import {
    FilenameProcessData,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    WinstonService, WinstonLog,
} from "@modules/winston"
import {
    S3UploadService,
    S3Provider,
} from "@modules/s3"
import {
    join,
    relative,
} from "path"
import {
    tmpdir,
} from "os"
import {
    promises as fsPromise,
} from "fs"

@Injectable()
export class ProcessVideoUploadStepService extends AbstractStepService<FilenameProcessData, undefined> {
    stepIndex = 3
    stepName = "upload"

    constructor(
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly s3UploadService: S3UploadService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Recursively walk a directory, returning all file paths.
     */
    private async walkDir(dir: string): Promise<Array<string>> {
        const files: Array<string> = []
        const entries = await fsPromise.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = join(dir, entry.name)
            if (entry.isDirectory()) {
                files.push(...await this.walkDir(fullPath))
            } else {
                files.push(fullPath)
            }
        }
        return files
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { assetId }, job } = context
        const taskDir = join(tmpdir(), `video-encoder-${assetId}`)

        this.winstonService.log(WinstonLog.ProcessStepExecuted, {
            jobId: job.id,
            step: this.stepName,
            stepIndex: this.stepIndex,
            meta: { assetId, message: "Uploading MPEG-DASH output to S3..." },
        })

        // Walk the output directory and upload each file
        const allFiles = await this.walkDir(taskDir)

        // Filter to only DASH output files (manifest.mpd, video/audio segments)
        const dashFiles = allFiles.filter((f) => {
            const name = f.toLowerCase()
            return name.endsWith(".mpd") ||
                name.endsWith(".m4s") ||
                name.endsWith(".m4f") ||
                name.endsWith(".mp4") ||
                name.includes("video") ||
                name.includes("audio")
        })

        const s3BasePath = `videos/${assetId}`
        let uploadCount = 0

        for (const filePath of dashFiles) {
            const relPath = relative(taskDir, filePath).replace(/\\/g, "/")
            const s3Key = `${s3BasePath}/${relPath}`
            const fileBuffer = await fsPromise.readFile(filePath)

            // Determine content type
            let contentType = "application/octet-stream"
            if (filePath.endsWith(".mpd")) {
                contentType = "application/dash+xml"
            } else if (filePath.endsWith(".m4s") || filePath.endsWith(".m4f")) {
                contentType = "video/iso.segment"
            } else if (filePath.endsWith(".mp4")) {
                contentType = "video/mp4"
            }

            // Upload to both providers
            await Promise.all([
                this.s3UploadService.buffer({
                    name: s3Key,
                    buffer: fileBuffer,
                    provider: S3Provider.Minio,
                    acl: "public-read",
                    contentType,
                }),
                this.s3UploadService.buffer({
                    name: s3Key,
                    buffer: fileBuffer,
                    provider: S3Provider.DigitalOcean,
                    acl: "public-read",
                    contentType,
                }),
            ])
            uploadCount++
        }

        this.winstonService.log(WinstonLog.ProcessStepExecuted, {
            jobId: job.id,
            step: this.stepName,
            stepIndex: this.stepIndex,
            success: true,
            meta: { assetId, uploadCount, s3BasePath },
        })

        await this.entityManager.transaction(async (em) => {
            await this.jobActionService.increaseJob({
                job, entityManager: em,
            })
            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult: {
                    uploadCount,
                    s3BasePath,
                },
                entityManager: em,
            })
        })
    }
}
