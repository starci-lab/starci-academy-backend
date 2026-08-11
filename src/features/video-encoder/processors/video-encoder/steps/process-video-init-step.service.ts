import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import type {
    ParseS3UrlResult,
} from "../types/parse-s3-url"
import {
    FilenameProcessData,
} from "@modules/integrations/bullmq/types/payloads/process-video"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    VideoDownloadFailedException,
} from "@modules/platform/exceptions/errors/video-encoder/video-download-failed"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    promises as fsPromise,
} from "fs"
import {
    join,
} from "path"
import {
    tmpdir,
} from "os"

@Injectable()
/**
 * Step 0 -- pulls the source object into a per-asset temp dir via the
 * authenticated S3 client (a public URL is not enough; MinIO vs DO must be
 * distinguished). Runs `queryAtStart` here so asset status flips with job
 * progress before encode begins.
 */
export class ProcessVideoInitStepService extends AbstractStepService<FilenameProcessData, undefined> {
    stepIndex = 0
    stepName = "init"

    constructor(
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly s3ReadService: S3ReadService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Detect S3 provider from URL and extract the object key.
     */
    private parseS3Url(url: string): ParseS3UrlResult {
        const urlObj = new URL(url)
        const minioEndpoint = envConfig().s3.minio.endpoint
        const minioBucket = envConfig().s3.minio.bucket

        // Check if URL matches MinIO endpoint
        if (minioEndpoint && url.startsWith(minioEndpoint)) {
            // URL format: http://localhost:9000/bucket/key
            const pathAfterBucket = urlObj.pathname.replace(`/${minioBucket}/`,
                "")
            return {
                provider: S3Provider.Minio,
                key: pathAfterBucket,
            }
        }

        // Check if URL contains the MinIO host (e.g. localhost:9000)
        const minioHost = minioEndpoint ? new URL(minioEndpoint).host : null
        if (minioHost && urlObj.host === minioHost) {
            const pathAfterBucket = urlObj.pathname.replace(`/${minioBucket}/`,
                "")
            return {
                provider: S3Provider.Minio,
                key: pathAfterBucket,
            }
        }

        // Default to DigitalOcean
        const doBucket = envConfig().s3.digitalOcean.bucket
        const pathAfterBucket = urlObj.pathname.replace(`/${doBucket}/`,
            "")
        return {
            provider: S3Provider.DigitalOcean,
            key: pathAfterBucket,
        }
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { callbackQueries, assetId, url, filename }, job } = context

        this.winstonService.log(WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id,
                step: this.stepName,
                stepIndex: this.stepIndex,
                meta: {
                    assetId, message: "Downloading video from S3..." 
                },
            })

        // Execute query at start
        const { queryAtStart } = callbackQueries
        if (queryAtStart && queryAtStart.length === 2) {
            await this.entityManager.query(queryAtStart[0],
                queryAtStart[1])
        }

        // Download the video via authenticated S3 client
        const { provider, key } = this.parseS3Url(url)
        const buffer = await this.s3ReadService.buffer({
            key, provider 
        })
        if (!buffer || buffer.length === 0) {
            throw new VideoDownloadFailedException({
                url,
                provider: String(provider),
                key,
            })
        }

        // Do not allocate a task directory until the source is known to exist;
        // terminal missing-object jobs otherwise leak one empty directory each.
        const taskDir = join(tmpdir(),
            `video-encoder-${assetId}`)
        await fsPromise.mkdir(taskDir,
            {
                recursive: true
            })

        const filePath = join(taskDir,
            filename)
        await fsPromise.writeFile(filePath,
            buffer)

        this.winstonService.log(WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id,
                step: this.stepName,
                stepIndex: this.stepIndex,
                success: true,
                meta: {
                    assetId,
                    provider,
                    key,
                    fileSizeMB: (buffer.length / 1024 / 1024).toFixed(2),
                    taskDir,
                },
            })

        await this.entityManager.transaction(async (em) => {
            await this.jobActionService.increaseJob({
                job, entityManager: em,
            })
            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult: {
                    taskDir,
                    filePath,
                },
                entityManager: em,
            })
        })
    }
}
