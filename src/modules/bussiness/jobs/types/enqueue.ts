import type {
    ModelProvider,
} from "@modules/databases"

/** Params for enqueuing an enroll job. */
export interface EnqueueEnrollJobParams {
    /** The ID of the transaction. */
    transactionId: string
    /** The ID of the user to enroll. */
    userId: string
    /** The ID of the course to enroll in. */
    courseId: string
    /** The ID of the job to requeue. */
    jobId?: string
}

/** Params for enqueuing a process-git-submission job. */
export interface EnqueueProcessGitSubmissionJobParams {
    /** `users.id`. */
    userId: string
    /** `user_challenge_submissions.id`. */
    userChallengeSubmissionId: string
    /** Existing `jobs.id` to requeue (optional). */
    jobId?: string
    /** Git branch override for repo loader. */
    branch?: string
    /** Grading model id override. */
    gradingModel?: string
    /** Grading model provider override. */
    gradingProvider?: ModelProvider
    /** Embedding model id override. */
    embeddingModel?: string
    /** Embedding model provider override. */
    embeddingProvider?: ModelProvider
}