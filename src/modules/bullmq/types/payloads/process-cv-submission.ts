import {
    ModelProvider 
} from "@modules/databases"

/**
 * BullMQ job body for challenge submission grading pipelines (Git or Google Docs).
 */
export interface ProcessCVSubmissionPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** `users.id`. */
    userId: string
    /** `cv_submissions.id`. */
    cvSubmissionId: string
    /** Provider of the analyze model. */
    analyzeProvider?: ModelProvider
    /** Model to use for analyze. */
    analyzeModel?: string
    /** Provider of the embedding model. */
    embeddingProvider?: ModelProvider
}
