import type {
    EnqueueRevokeGithubPayload,
} from "@modules/integrations/bullmq/types/payloads/revoke-github"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    enqueueLearnerEmail,
} from "@modules/integrations/transactional-email/enqueue-learner-email"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    GithubApiOrgService,
} from "@modules/integrations/github/org.service"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"

const DISPATCH_CHECKPOINT = "revoke-github-dispatch-claimed"

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
        const executionResult = await this.execute(context)
        await this.finalize(executionResult,
            context)
    }

    /**
     * Execute the step.
     * @param context - The job context.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<EnqueueRevokeGithubPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const shouldDispatch = await this.claimDispatch(context)
        if (!shouldDispatch) {
            return {
            }
        }
        const { payload } = context
        try {
            await this.githubApiOrgService.removeUserFromTeamInOrg({
                teamSlug: payload.teamSlug,
                githubUsername: payload.githubUsername,
            })
        } catch (error) {
            await this.releaseDispatch(context)
            throw error
        }
        return {
        }
    }

    /** Claim the GitHub state transition so a post-call persistence retry does not dispatch twice. */
    private async claimDispatch(
        context: JobExtendedContext<EnqueueRevokeGithubPayload, EmptyObject>,
    ): Promise<boolean> {
        return this.entityManager.transaction(async (entityManager) => {
            const job = await entityManager.findOneOrFail(
                JobEntity,
                {
                    where: {
                        id: context.job.id,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                },
            )
            const claimed = await this.jobActionService.loadExecutionResult<boolean>({
                job,
                key: DISPATCH_CHECKPOINT,
            })
            if (claimed) {
                context.job.executionResults = job.executionResults
                return false
            }
            await this.jobActionService.saveExecutionResult({
                job,
                key: DISPATCH_CHECKPOINT,
                executionResult: true,
                entityManager,
            })
            context.job.executionResults = job.executionResults
            return true
        })
    }

    /** Release the claim when GitHub explicitly failed, allowing BullMQ to retry the call. */
    private async releaseDispatch(
        context: JobExtendedContext<EnqueueRevokeGithubPayload, EmptyObject>,
    ): Promise<void> {
        await this.jobActionService.saveExecutionResult({
            job: context.job,
            key: DISPATCH_CHECKPOINT,
            executionResult: false,
        })
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

        // GitHub team membership removed -> notify the learner their access ended.
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
