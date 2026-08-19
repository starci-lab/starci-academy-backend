import type {
    ProcessGitSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/process-git-submission"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
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
import {
    SubmissionCompletionNotifierService,
} from "../../shared/challenge-submission/submission-completion-notifier.service"
import {
    LegacyCreditChargeService,
} from "../../shared/challenge-submission/legacy-credit-charge.service"

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
            progressProjectionService: ProgressProjectionService,
            challengeProgressService: ChallengeProgressService,
            submissionCompletionNotifierService: SubmissionCompletionNotifierService,
            legacyCreditChargeService: LegacyCreditChargeService,
    ) {
        super(
            entityManager,
            jobActionService,
            winstonService,
            eventEmitterService,
            dayjsService,
            progressProjectionService,
            challengeProgressService,
            submissionCompletionNotifierService,
            legacyCreditChargeService,
        )
    }
}
