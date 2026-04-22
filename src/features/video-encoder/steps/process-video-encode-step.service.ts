import {
    Injectable, Logger 
} from "@nestjs/common"
import {
    AbstractStepService 
} from "../abstracts"
import {
    JobExtendedContext 
} from "../types"
import {
    FilenameProcessData 
} from "@modules/bullmq"
import {
    JobActionService 
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager 
} from "@modules/databases"
import {
    EntityManager 
} from "typeorm"

@Injectable()
export class ProcessVideoEncodeStepService extends AbstractStepService<FilenameProcessData, undefined> {
    private readonly logger = new Logger(ProcessVideoEncodeStepService.name)
    stepIndex = 1
    stepName = "encode"

    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { assetId, filename }, job } = context
        this.logger.verbose(`2/5. Encoding video at multiple bitrates for asset ${assetId}...`)
        
        // TODO: Call this.ffmegService.encodeAtMultipleBitrates(assetId, filename)
        // await this.ffmegService.encodeAtMultipleBitrates(assetId, filename)

        await this.entityManager.transaction(async (em) => {
            await this.jobActionService.increaseJob({
                job, entityManager: em 
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
