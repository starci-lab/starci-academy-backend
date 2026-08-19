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
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    GithubApiOrgService,
} from "@modules/integrations/github/org.service"
import {
    claimDispatch,
    releaseDispatch,
} from "../../shared/claim-dispatch"
import {
    finalizeStep,
} from "../../shared/finalize-step"

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
        await finalizeStep({
            entityManager: this.entityManager,
            jobActionService: this.jobActionService,
            winstonService: this.winstonService,
            stepName: this.stepName,
            stepIndex: this.stepIndex,
            executionResult,
            context,
        })

        // GitHub team membership removed -> notify the learner their access ended.
        await enqueueLearnerEmail({
            entityManager: this.entityManager,
            enqueueSendMailJobService: this.enqueueSendMailJobService,
            userId: context.payload.userId,
            template: "access-revoked",
            webBaseUrl: envConfig().web.baseUrl,
            subject: {
                vi: "Quyền truy cập repository đã được gỡ", // vn-ok: vi-locale string emitted to clients
                en: "Your repository access was removed",
            },
        })
    }

    /**
     * Execute the step.
     * @param context - The job context.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<EnqueueRevokeGithubPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const shouldDispatch = await claimDispatch({
            entityManager: this.entityManager,
            jobActionService: this.jobActionService,
            context,
            checkpoint: DISPATCH_CHECKPOINT,
        })
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
            await releaseDispatch({
                jobActionService: this.jobActionService,
                job: context.job,
                checkpoint: DISPATCH_CHECKPOINT,
            })
            throw error
        }
        return {
        }
    }
}
