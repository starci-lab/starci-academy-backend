import type {
    SyncCdnPayload,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"

/**
 * Step 1: last pipeline step (persist execution slice + advance job).
 */
@Injectable()
export class ProcessCdnCompleteStepService extends AbstractStepService<
    SyncCdnPayload,
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
        context: JobExtendedContext<SyncCdnPayload, EmptyObject>,
    ): Promise<void> {
        const executionResult = await this.execute(
        )
        await this.finalize(
            executionResult,
            context,
        )
    }

    private async execute(): Promise<EmptyObject> {
        return {
        }
    }

    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<SyncCdnPayload, EmptyObject>,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    }
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    }
                )
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
