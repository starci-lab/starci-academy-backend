import type {
    SyncEmailBloomFilterPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "@modules/bullmq"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    JobExtendedContext,
} from "@modules/bullmq"
import {
    EmptyObject 
} from "@modules/common"

/**
 * Step 3: Finalize the sync-email-bloom-filter step.
 */
@Injectable()
export class ProcessCompleteStepService extends AbstractStepService<
    SyncEmailBloomFilterPayload,
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

    stepIndex = 2

    stepName = "complete"
    /** Process the step. */
    async process(
        context: JobExtendedContext<
            SyncEmailBloomFilterPayload,
            EmptyObject
        >,
    ): Promise<void> {
        const executionResult = await this.execute()
        await this.finalize(
            executionResult,
            context,
        )
    }

    /** Execute the step. */
    private async execute(
    ): Promise<EmptyObject> {
        return {
        }
    }

    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<
            SyncEmailBloomFilterPayload,
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
            }
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
