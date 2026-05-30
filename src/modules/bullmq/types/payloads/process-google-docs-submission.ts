import {
    AiMode,
    Locale,
    ModelProvider,
} from "@modules/databases"

/**
 * BullMQ job body for Google Docs submission grading pipelines.
 */
export interface ProcessGoogleDocsSubmissionPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** `enrollments.id`. */
    enrollmentId: string
    /** `user_challenge_submissions.id`. */
    userChallengeSubmissionId: string
    /** Model to use for grading. */
    gradingModel?: string
    /** Provider of the grading model. */
    gradingProvider?: ModelProvider
    /** Model to use for embedding. */
    embeddingModel?: string
    /** Provider of the embedding model. */
    embeddingProvider?: ModelProvider
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: Locale
    /** BYOK: provider of the user-supplied key (used only in `byok` mode). */
    byokProvider?: ModelProvider
    /** BYOK: model to invoke with the user-supplied key. */
    byokModel?: string
    /** BYOK: the user's own raw API key. */
    byokApiKey?: string
    /** AI lane the user picked at submit time; validated against entitlement. */
    mode?: AiMode
    /**
     * SCHEMA V2 only: programming language the learner chose (typescript/java/csharp/go). Selects
     * the matching `approachCriteria` bucket at grade time.
     */
    lang?: string
}
