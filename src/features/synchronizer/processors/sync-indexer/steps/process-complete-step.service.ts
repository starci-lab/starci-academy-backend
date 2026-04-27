import type {
    SyncIndexerPayload,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"

/**
 * Final step: mark the pipeline complete.
 */
@Injectable()
export class ProcessSyncIndexerCompleteStep extends AbstractStepService<
    SyncIndexerPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "complete"

    async process(
        context: JobExtendedContext<
            SyncIndexerPayload,
            EmptyObject
        >,
    ): Promise<void> {
        const executionResult = {
        }
        await this.finalize(
            executionResult,
            context
        )
    }

    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<
            SyncIndexerPayload,
            EmptyObject
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob({
                    job,
                    entityManager,
                })
                await this.jobActionService.saveExecutionResult({
                    job,
                    key: this.stepName,
                    executionResult,
                    entityManager,
                })
            },
        )
        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )
    }
}

