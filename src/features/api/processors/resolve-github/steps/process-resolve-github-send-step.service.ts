import type {
    EnqueueResolveGithubPayload,
} from "@modules/integrations/bullmq/types/payloads/resolve-github"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
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

const DISPATCH_CHECKPOINT = "resolve-github-dispatch-claimed"

@Injectable()
/**
 * Step 0: send GitHub team membership request.
 */
export class ProcessResolveGithubSendStepService extends AbstractStepService<
    EnqueueResolveGithubPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly githubApiOrgService: GithubApiOrgService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "send-github"

    /**
     * Process the step.
     * @param context - The job context.
     * @returns The execution result.
     */
    async process(
        context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject>,
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
        context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const shouldDispatch = await this.claimDispatch(context)
        if (!shouldDispatch) {
            return {
            }
        }
        const { payload } = context
        try {
            await this.githubApiOrgService.addUserToTeamInOrg({
                teamSlug: payload.teamSlug,
                githubUsername: payload.githubUsername,
                role: "member",
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
        context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject>,
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
        context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject>,
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

