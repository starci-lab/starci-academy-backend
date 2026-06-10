import {
    Locale,
} from "@modules/databases"
import type {
    AiJobSelection,
} from "@modules/ai"

/**
 * Payload for the review-personal-project-task BullMQ queue.
 */
export interface ReviewPersonalProjectTaskPayload {
    /** Enrollment ID (attempt is created after grading). */
    enrollmentId: string
    /** GitHub URL submitted for review. */
    githubUrl: string
    /** Task ID to review. */
    taskId: string
    /** Branch to grade (defaults to "main"). */
    branch?: string
    /** Model to use for embedding. */
    embeddingModel?: string
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: Locale
    /**
     * Chosen programming language for a SCHEMA V2 task (typescript/java/csharp/go), used to pick the
     * per-language approach criteria bodies. Ignored for legacy tasks and agnostic tasks.
     */
    lang?: string
    /** AI lane + model pick (validated against entitlement at grade time). */
    ai?: AiJobSelection
}
