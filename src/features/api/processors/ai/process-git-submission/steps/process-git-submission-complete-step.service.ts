import type {
    ProcessGitSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/process-git-submission"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    ChallengeProgressService,
} from "@modules/bussiness/progress/challenge.service"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
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
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import type {
    ProcessGitSubmissionGradeStepExecuteResult,
} from "../types/execute"
import type {
    ExtendedProcessGitSubmissionContext,
} from "../types/extended"
import {
    AbstractSubmissionCompleteStepService,
} from "../../shared/challenge-submission/abstract-submission-complete-step.service"

@Injectable()
/**
 * Step 1: finalize -- load grade result, then ATOMICALLY persist the attempt + feedbacks,
 * the credit charge, the XP/points grant, and the job step advance in ONE transaction.
 *
 * The attempt carries `idempotencyKey = job.id` (one attempt per grading job): a retried or
 * stalled-re-dispatched job cannot create a second attempt or double-charge. Because the
 * side effects and the `currentStep` advance commit together, there is no window where a
 * crash leaves a charged-but-unadvanced job.
 *
 * All of the above is shared verbatim with the Google-Docs pipeline's complete step -- see
 * {@link AbstractSubmissionCompleteStepService}. Only the type parameters differ.
 */
export class ProcessGitSubmissionCompleteStepService extends AbstractSubmissionCompleteStepService<
    ProcessGitSubmissionPayload,
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionGradeStepExecuteResult
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
            entityManager: EntityManager,
            jobActionService: JobActionService,
            winstonService: WinstonService,
            eventEmitterService: EventEmitterService,
            dayjsService: DayjsService,
            aiEntitlementService: AiEntitlementService,
            aiModelCatalogService: AiModelCatalogService,
            progressProjectionService: ProgressProjectionService,
            challengeProgressService: ChallengeProgressService,
            enqueueSendMailJobService: EnqueueSendMailJobService,
            notificationService: NotificationService,
    ) {
        super(
            entityManager,
            jobActionService,
            winstonService,
            eventEmitterService,
            dayjsService,
            aiEntitlementService,
            aiModelCatalogService,
            progressProjectionService,
            challengeProgressService,
            enqueueSendMailJobService,
            notificationService,
        )
    }
}
