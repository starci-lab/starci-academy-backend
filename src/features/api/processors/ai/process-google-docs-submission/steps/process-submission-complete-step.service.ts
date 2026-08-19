import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/process-google-docs-submission"
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
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
} from "../types/execute"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
} from "../types/extended"
import {
    AbstractSubmissionCompleteStepService,
} from "../../shared/challenge-submission/abstract-submission-complete-step.service"

@Injectable()
/**
 * Step 1: finalize -- load grade result, then ATOMICALLY persist the attempt + feedbacks,
 * the credit charge, the XP/points grant, and the job step advance in ONE transaction.
 * The attempt carries `idempotencyKey = job.id`, so a retried/stalled job cannot create a
 * second attempt or double-charge.
 *
 * All of the above is shared verbatim with the git-submission pipeline's complete step -- see
 * {@link AbstractSubmissionCompleteStepService}. Only the type parameters differ.
 */
export class ProcessGoogleDocsSubmissionCompleteStepService extends AbstractSubmissionCompleteStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext,
    ProcessGoogleDocsSubmissionGradeStepExecuteResult
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
