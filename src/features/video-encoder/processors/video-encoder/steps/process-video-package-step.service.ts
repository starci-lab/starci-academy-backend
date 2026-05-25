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
    Bento4Service,
} from "@modules/bento4"
import {
    FfmpegService,
} from "@modules/ffmpeg"
import {
    join,
} from "path"
import {
    tmpdir,
} from "os"

@Injectable()
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

        this.winstonService.log(WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id,
                step: this.stepName,
                stepIndex: this.stepIndex,
                meta: {
                    assetId, message: "Fragmenting and generating MPEG-DASH manifest..." 
                },
            })

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
