import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

/**
 * Payload for the process-personal-project BullMQ queue.
 */
export interface ProcessPersonalProjectPayload {
    /** Personal project attempt ID. */
    attemptId: string
    /** Branch to grade (defaults to "main"). */
    branch?: string
    /** LLM model override for grading. */
    gradingModel?: string
    /** LLM provider override for grading. */
    gradingProvider?: ModelProvider
    /** Embedding model override. */
    embeddingModel?: string
    /** Embedding provider override. */
    embeddingProvider?: ModelProvider
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: Locale
}
