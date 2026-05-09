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
    WinstonService,
    WinstonLog,
} from "@modules/winston"
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
export class ProcessVideoEncodeStepService extends AbstractStepService<FilenameProcessData, undefined> {
    stepIndex = 1
    stepName = "encode"

    constructor(
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly ffmpegService: FfmpegService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { assetId, filename }, job } = context
        const taskDir = join(tmpdir(), `video-encoder-${assetId}`)

        this.winstonService.log(
            WinstonLog.ProcessStepExecuted, {
            jobId: job.id,
            step: this.stepName,
            stepIndex: this.stepIndex,
            meta: { assetId, message: "Encoding video at multiple bitrates..." },
        })

        await this.ffmpegService.encodeAtMultipleBitrates(taskDir, filename)

        this.winstonService.log(
            WinstonLog.ProcessStepExecuted, {
            jobId: job.id,
            step: this.stepName,
            stepIndex: this.stepIndex,
            success: true,
            meta: { assetId },
        })

        await this.entityManager.transaction(async (em) => {
            await this.jobActionService.increaseJob({
                job, entityManager: em,
            })
            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult: {},
                entityManager: em,
            })
        })
    }
}
