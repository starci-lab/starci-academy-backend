import {
    Locale,
    ModelProvider 
} from "@modules/databases"

/**
 * BullMQ job body for challenge submission grading pipelines (Git or Google Docs).
 */
export interface ProcessGitSubmissionPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** `users.id`. */
    userId: string
    /** `enrollments.id`. */
    enrollmentId: string
    /** `courses.id`. */
    courseId: string
    /** `user_challenge_submissions.id`. */
    userChallengeSubmissionId: string
    /** `challenge_submissions.id`. */
    challengeSubmissionId: string
    /** Branch override. */
    branch?: string
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
}

/**
 * BODY body for Google Doc submission grading pipelines.
 */
export type ProcessGoogleDocsSubmissionPayload = ProcessGitSubmissionPayload
