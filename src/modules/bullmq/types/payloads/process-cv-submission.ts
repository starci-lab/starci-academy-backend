import {
    Locale,
    ModelProvider,
} from "@modules/databases"
import type {
    AiJobSelection,
} from "@modules/ai"

/**
 * BullMQ job body for the review-CV-submission worker (`process-cv-submission` queue).
 */
export interface ReviewCvSubmissionPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** `cv_submissions.id`. */
    cvSubmissionId: string
    /** Provider of the embedding model. */
    embeddingProvider?: ModelProvider
    /** Model to use for embedding. */
    embeddingModel?: string
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: Locale
    /** `template_cvs.id` — which review rubric level to use. */
    templateCvId?: string
    /** `user_cv_submission_attempts.id` being reviewed. */
    cvSubmissionAttemptId?: string
    /** Persist final review output back onto the canonical submission attempt. */
    persistReviewAsCanonicalAttempt?: boolean
    /** AI lane + model pick (validated against entitlement at grade time). */
    ai?: AiJobSelection
}
