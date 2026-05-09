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
    /** Milestone task ID to review. */
    milestoneTaskId: string
    /** Branch to grade (defaults to "main"). */
    branch?: string
    /** LLM model override for grading. */
    gradingModel?: string
    /** LLM provider override for grading. */
    gradingProvider?: ModelProvider
    /** Locale hint for filtering/prompting. */
    locale?: Locale
}
