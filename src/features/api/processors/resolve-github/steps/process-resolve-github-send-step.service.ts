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
        await finalizeStep({
            entityManager: this.entityManager,
            jobActionService: this.jobActionService,
            winstonService: this.winstonService,
            stepName: this.stepName,
            stepIndex: this.stepIndex,
            executionResult,
            context,
        })
    }

    /**
     * Execute the step.
     * @param context - The job context.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject>,
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
            await this.githubApiOrgService.addUserToTeamInOrg({
                teamSlug: payload.teamSlug,
                githubUsername: payload.githubUsername,
                role: "member",
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
