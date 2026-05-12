import {
    Locale,
    ModelProvider,
} from "@modules/databases"

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
    /** Model to use for grading. */
    gradingModel?: string
    /** Provider of the grading model. */
    gradingProvider?: ModelProvider
    /** Model to use for embedding. */
    embeddingModel?: string
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: Locale
}
