import type {
    EnqueueResolveGithubPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    AbstractStepService,
    EnqueueSendMailJobService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    enqueueLearnerEmail,
} from "@modules/transactional-email"
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

@Injectable()
/**
 * Step 2: complete step (execution slice + step advance).
 */
export class ProcessResolveGithubCompleteStepService extends AbstractStepService<
    EnqueueResolveGithubPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    stepIndex = 2
    stepName = "complete"

    async process(
        context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject>,
    ): Promise<void> {
        const executionResult = await this.execute()
        await this.finalize(
            executionResult,
            context,
        )
    }

    /**
     * Execute the step.
     * @returns The execution result.
     */
    private async execute(): Promise<EmptyObject> {
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

        // GitHub org/team membership resolved → the learner now has repo access.
        await enqueueLearnerEmail({
            entityManager: this.entityManager,
            enqueueSendMailJobService: this.enqueueSendMailJobService,
            userId: payload.userId,
            template: "repo-access-granted",
            webBaseUrl: envConfig().web.baseUrl,
            subject: {
                vi: "Bạn đã được cấp quyền truy cập repository", // vn-ok: vi-locale string emitted to clients
                en: "Your repository access is ready",
            },
            extraContext: {
                githubUsername: payload.githubUsername,
            },
        })
    }
}

