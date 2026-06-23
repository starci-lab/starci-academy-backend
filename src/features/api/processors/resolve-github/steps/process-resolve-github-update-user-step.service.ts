import type {
    EnqueueResolveGithubPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
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
import {
    UserNotFoundException,
} from "@modules/exceptions"

/**
 * Step 1: update internal user `githubUsername`.
 */
@Injectable()
export class ProcessResolveGithubUpdateUserStepService extends AbstractStepService<
    EnqueueResolveGithubPayload,
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
    stepName = "update-user"

    /**
     * Process the step.
     * @param context - The job context.
     * @returns The execution result.
     */
    async process(
        context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject>,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(
                context,
            )
            await this.finalize(
                executionResult,
                context,
            )
        } catch (error) {
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: (error as Error).message,
                },
            )
            throw error
        }
    }

    /**
     * Execute the step.
     * @param context - The job context.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const { payload } = context
        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    id: payload.userId,
                },
            },
        )
        if (!user) {
            throw new UserNotFoundException({
                id: payload.userId,
            })
        }
        user.githubUsername = payload.githubUsername
        await this.entityManager.save(user)
        return {
        }
    }

    /**
     * Finalize the step.
     * @param executionResult - The execution result.
     * @param context - The job context.
     * @returns The void.
     */
    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject>,
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
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    },
                )
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

