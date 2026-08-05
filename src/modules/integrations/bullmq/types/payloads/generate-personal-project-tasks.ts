import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

/**
 * Payload for the generate-personal-project-tasks BullMQ queue.
 */
export interface GeneratePersonalProjectTasksPayload {
    /** Enrollment ID -- the user's enrollment to generate tasks for. */
    enrollmentId: string
    /** LLM model name override (e.g. "gpt-4o-mini", "gemini-2.0-flash"). */
    model?: string
    /** LLM provider override. */
    provider?: ModelProvider
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: Locale
}
