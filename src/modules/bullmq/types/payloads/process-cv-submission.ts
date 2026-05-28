import {
    AiMode,
    Locale,
    ModelProvider,
} from "@modules/databases"

/**
 * BullMQ job body for the review-CV-submission worker (`process-cv-submission` queue).
 */
export interface ReviewCvSubmissionPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** `cv_submissions.id`. */
    cvSubmissionId: string
    /** Provider of the analyze model. */
    analyzeProvider?: ModelProvider
    /** Model to use for analyze. */
    analyzeModel?: string
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
    /** BYOK: provider of the user-supplied key (used only in `byok` mode). */
    byokProvider?: ModelProvider
    /** BYOK: model to invoke with the user-supplied key. */
    byokModel?: string
    /** BYOK: the user's own raw API key. */
    byokApiKey?: string
    /** AI lane the user picked at submit time; validated against entitlement. */
    mode?: AiMode
}
