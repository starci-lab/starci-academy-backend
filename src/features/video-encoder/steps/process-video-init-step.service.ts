import {
    Injectable, Logger 
} from "@nestjs/common"
import {
    AbstractStepService 
} from "../abstracts"
import {
    JobExtendedContext, VideoEncoderStepExecutionResult 
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
export class ProcessVideoInitStepService extends AbstractStepService<FilenameProcessData, undefined> {
    private readonly logger = new Logger(ProcessVideoInitStepService.name)
    stepIndex = 0
    stepName = "init"

    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { callbackQueries, assetId }, job } = context
        this.logger.verbose(`1/5. Handling query at the start for asset ${assetId}...`)
        
        const { queryAtStart } = callbackQueries
        if (queryAtStart && queryAtStart.length === 2) {
            await this.entityManager.query(queryAtStart[0],
                queryAtStart[1])
        }

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
