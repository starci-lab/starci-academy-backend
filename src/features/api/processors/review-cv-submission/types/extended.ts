import {
    UserCVSubmissionEntity,
    UserEntity,
} from "@modules/databases"

/**
 * Extended context for the review-cv-submission pipeline.
 *
 * A submission has **no** attempts until the learner finishes upload / verify (that flow inserts the
 * **first** row). This job is enqueued only after that staging row exists; the pipeline does **not**
 * create that first attempt. A **second** canonical attempt (plus MinIO copy) is only inserted in
 * the **complete** step when `persistReviewAsCanonicalAttempt` is true; otherwise the same staging
 * row is updated to Done.
 *
 * The staging attempt for this job is **not** on `extended`; use `payload.cvSubmissionAttemptId` and
 * load `UserCVSubmissionAttemptEntity` in a step when needed.
 */
export interface ExtendedReviewCvSubmissionContext {
    /** The CV submission being processed. */
    cvSubmission: UserCVSubmissionEntity
    /** The user who submitted the CV. */
    user: UserEntity
}
