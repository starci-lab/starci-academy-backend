import {
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
    /** `user_challenge_submissions.id`. */
    userChallengeSubmissionId: string
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
}
