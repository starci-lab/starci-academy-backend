import type {
    EntityManager,
} from "typeorm"
import type {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import type {
    AbstractSubmissionCompletionExtended,
    AbstractSubmissionCompletionGradeResult,
    AbstractSubmissionCompletionPayload,
} from "../abstract-submission-complete-step.service"

/** Params to atomically persist one graded submission attempt plus its rewards and step advance. */
export interface PersistSubmissionCompletionParams<
    TPayload extends AbstractSubmissionCompletionPayload,
    TExtended extends AbstractSubmissionCompletionExtended,
    TGrade extends AbstractSubmissionCompletionGradeResult,
> {
    /** The transactional entity manager the whole write must run on. */
    entityManager: EntityManager
    /** The job row backing this run, used for idempotency keying and the step advance. */
    job: JobEntity
    /** The decoded queue payload. */
    payload: TPayload
    /** The extended pipeline context, carrying the submission's URL when resolved earlier. */
    extended: TExtended | undefined
    /** The validated grade result produced by the grade step. */
    grade: TGrade
}

/** Result of {@link AbstractSubmissionCompleteStepService.persistCompletionAtomically}. */
export interface PersistSubmissionCompletionResult {
    /** Whether this run created a new attempt (false when idempotency found one already). */
    createdNewAttempt: boolean
    /** The user to charge for this grading run, or `undefined` when idempotency found one already. */
    chargedUserId: string | undefined
}

/** Params to grant the once-per-challenge pass reward for a graded submission attempt. */
export interface GrantChallengePassRewardParams<
    TPayload extends AbstractSubmissionCompletionPayload,
> {
    /** The transactional entity manager the whole write must run on. */
    entityManager: EntityManager
    /** The decoded queue payload. */
    payload: TPayload
    /** The persisted attempt id the XP grant is keyed to. */
    attemptId: string
    /** The score to grant as XP amount. */
    score: number
}

/** Params to debit legacy (pre-invoke-charge) credit after a completion commits. */
export interface ChargeLegacyCreditIfNeededParams<
    TGrade extends AbstractSubmissionCompletionGradeResult,
> {
    /** The job row, used to check the `creditCharged` marker. */
    job: JobEntity
    /** The validated grade result produced by the grade step. */
    grade: TGrade
    /** Whether this run created a new attempt. */
    createdNewAttempt: boolean
    /** The user to charge, or `undefined` when idempotency found an existing attempt. */
    chargedUserId: string | undefined
}

/** Params to notify a learner that their submission challenge attempt was graded. */
export interface NotifySubmissionCompletionParams<
    TPayload extends AbstractSubmissionCompletionPayload,
    TGrade extends AbstractSubmissionCompletionGradeResult,
> {
    /** The decoded queue payload. */
    payload: TPayload
    /** The job row, used only for log correlation. */
    job: JobEntity
    /** The queue name, used only for log correlation. */
    queueName: string | undefined
    /** The validated grade result produced by the grade step. */
    grade: TGrade
}
