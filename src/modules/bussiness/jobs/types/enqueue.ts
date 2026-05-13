import type {
    Locale,
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
    /** `enrollments.id`. */
    enrollmentId: string
    /** `courses.id`. */
    courseId: string
    /** `challenge_submissions.id`. */
    challengeSubmissionId: string
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
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: string
}

/** Params for enqueuing a process-google-docs-submission job. */
export interface EnqueueProcessGoogleDocsSubmissionJobParams {
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
    /** Existing `jobs.id` to requeue (optional). */
    jobId?: string
    /** Grading model id override. */
    gradingModel?: string
    /** Grading model provider override. */
    gradingProvider?: ModelProvider
    /** Embedding model id override. */
    embeddingModel?: string
    /** Embedding model provider override. */
    embeddingProvider?: ModelProvider
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: string
}

/** Params for enqueuing a process-cv-submission job. */
export interface EnqueueProcessCvSubmissionJobParams {
    /** `users.id`. */  
    userId: string
    /** `cv_submissions.id`. */
    cvSubmissionId: string
    /** Existing `jobs.id` to requeue (optional). */
    jobId?: string
    /** Analyze model id override. */
    analyzeModel?: string
    /** Analyze model provider override. */
    analyzeProvider?: ModelProvider
    /** Embedding model id override. */
    embeddingModel?: string
    /** Embedding model provider override. */
    embeddingProvider?: ModelProvider
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: Locale
    /** `template_cvs.id` — which review rubric level to use. */
    templateCvId?: string
}