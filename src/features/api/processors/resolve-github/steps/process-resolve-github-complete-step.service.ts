import type {
    EnqueueResolveGithubPayload,
} from "@modules/integrations/bullmq/types/payloads/resolve-github"
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
    finalizeStep,
} from "../../shared/finalize-step"

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
        const executionResult: EmptyObject = {
        }
        await finalizeStep({
            entityManager: this.entityManager,
            jobActionService: this.jobActionService,
            winstonService: this.winstonService,
            stepName: this.stepName,
            stepIndex: this.stepIndex,
            executionResult,
            context,
        })

        // GitHub org/team membership resolved -> the learner now has repo access.
        await enqueueLearnerEmail({
            entityManager: this.entityManager,
            enqueueSendMailJobService: this.enqueueSendMailJobService,
            userId: context.payload.userId,
            template: "repo-access-granted",
            webBaseUrl: envConfig().web.baseUrl,
            subject: {
                vi: "Bạn đã được cấp quyền truy cập repository", // vn-ok: vi-locale string emitted to clients
                en: "Your repository access is ready",
            },
            extraContext: {
                githubUsername: context.payload.githubUsername,
            },
        })
    }
}
