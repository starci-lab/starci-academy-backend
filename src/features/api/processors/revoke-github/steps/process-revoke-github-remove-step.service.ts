import type {
    EnqueueRevokeGithubPayload,
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
import {
    GithubApiOrgService,
} from "@modules/github"

@Injectable()
/**
 * Step 0: remove the user from the course GitHub team (revoke repo access).
 */
export class ProcessRevokeGithubRemoveStepService extends AbstractStepService<
    EnqueueRevokeGithubPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly githubApiOrgService: GithubApiOrgService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "remove-github"

    /**
     * Process the step.
     * @param context - The job context.
     * @returns The execution result.
     */
    async process(
        context: JobExtendedContext<EnqueueRevokeGithubPayload, EmptyObject>,
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
        context: JobExtendedContext<EnqueueRevokeGithubPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const { payload } = context
        await this.githubApiOrgService.removeUserFromTeamInOrg(
            {
                teamSlug: payload.teamSlug,
                githubUsername: payload.githubUsername,
            },
        )
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
        context: JobExtendedContext<EnqueueRevokeGithubPayload, EmptyObject>,
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

        // GitHub team membership removed → notify the learner their access ended.
        await enqueueLearnerEmail({
            entityManager: this.entityManager,
            enqueueSendMailJobService: this.enqueueSendMailJobService,
            userId: payload.userId,
            template: "access-revoked",
            webBaseUrl: envConfig().web.baseUrl,
            subject: {
                vi: "Quyền truy cập repository đã được gỡ", // vn-ok: vi-locale string emitted to clients
                en: "Your repository access was removed",
            },
        })
    }
}
