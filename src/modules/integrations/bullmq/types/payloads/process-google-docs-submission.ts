import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import type {
    AiJobSelection,
} from "@modules/ai/types/ai-job-selection"

/**
 * BullMQ job body for Google Docs submission grading pipelines.
 */
export interface ProcessGoogleDocsSubmissionPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** Immutable attempt prepared before this job was published. */
    attemptId?: string
    /** `enrollments.id`. */
    enrollmentId: string
    /** `user_challenge_submissions.id`. */
    userChallengeSubmissionId: string
    /** Model to use for embedding. */
    embeddingModel?: string
    /** Provider of the embedding model. */
    embeddingProvider?: ModelProvider
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: Locale
    /** AI lane + model pick (validated against entitlement at grade time). */
    ai?: AiJobSelection
    /**
     * SCHEMA V2 only: programming language the learner chose (typescript/java/csharp/go). Selects
     * the matching `approachCriteria` bucket at grade time.
     */
    lang?: string
}
