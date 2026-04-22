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
export class ProcessVideoFinalizeStepService extends AbstractStepService<FilenameProcessData, undefined> {
    private readonly logger = new Logger(ProcessVideoFinalizeStepService.name)
    stepIndex = 4
    stepName = "finalize"

    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { callbackQueries, assetId }, job } = context
        this.logger.verbose(`5/5. Cleaning up and finalizing for asset ${assetId}...`)
        
        // Clean up
        // await this.cleanUp(assetId)

        // Query At End
        const { queryAtEnd } = callbackQueries
        if (queryAtEnd && queryAtEnd.length === 2) {
            await this.entityManager.query(queryAtEnd[0],
                queryAtEnd[1])
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
