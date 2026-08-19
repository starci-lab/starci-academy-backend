import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
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
    Bento4Service,
} from "@modules/integrations/bento4/bento4.service"
import {
    FfmpegService,
} from "@modules/integrations/ffmpeg/ffmpeg.service"
import {
    join,
} from "node:path"
import {
    tmpdir,
} from "node:os"
import {
    promises as fsPromise,
} from "node:fs"

@Injectable()
/**
 * Step 2 -- Bento4 fragment + MPEG-DASH manifest. Isolated because fragmentation
 * is checked per rendition; re-running after a partial package must not
 * double-fragment already-cut files.
 */
export class ProcessVideoPackageStepService extends AbstractStepService<FilenameProcessData, undefined> {
    stepIndex = 2
    stepName = "package"

    constructor(
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly bento4Service: Bento4Service,
        private readonly ffmpegService: FfmpegService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { assetId }, job } = context
        const taskDir = join(tmpdir(),
            `video-encoder-${assetId}`)
        const manifestPath = join(taskDir,
            "manifest.mpd")

        this.winstonService.log(WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id,
                step: this.stepName,
                stepIndex: this.stepIndex,
                meta: {
                    assetId, message: "Fragmenting and generating MPEG-DASH manifest..." 
                },
            })

        // A worker may lose its BullMQ acknowledgement after packaging completed.
        // Treat the durable manifest as the step's idempotency marker so retrying
        // does not invoke Bento4 over already-packaged files or duplicate output.
        const packageAlreadyExists = await fsPromise.access(manifestPath)
            .then(() => true)
            .catch(() => false)
        if (!packageAlreadyExists) {
            // Fragment each encoded video
            const videoNames = this.ffmpegService.videoNames
            const fragmentPromises: Array<Promise<void>> = []
            for (const videoName of videoNames) {
                const promise = async () => {
                    const fragmentationRequired = await this.bento4Service.checkFragments(
                        taskDir,
                        videoName,
                    )
                    if (fragmentationRequired) {
                        await this.bento4Service.fragmentVideo(taskDir,
                            videoName)
                    }
                }
                fragmentPromises.push(promise())
            }
            await Promise.all(fragmentPromises)

            // Generate MPEG-DASH manifest
            await this.bento4Service.generateMpegDashManifestFromFragments(
                taskDir,
                videoNames,
            )
        }

        this.winstonService.log(WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id,
                step: this.stepName,
                stepIndex: this.stepIndex,
                success: true,
                meta: {
                    assetId 
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
                },
                entityManager: em,
            })
        })
    }
}
