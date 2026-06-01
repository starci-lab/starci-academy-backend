import type {
    Locale,
    ModelProvider,
} from "@modules/databases"
import type {
    AiJobSelection,
} from "@modules/ai"
import type {
    SendMailPayload,
    SyncCdnPayload,
    SyncElasticsearchPayload,
    SyncIndexerPayload,
    SyncScyllaDBPayload,
} from "@modules/bullmq"

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
    /** Embedding model id override. */
    embeddingModel?: string
    /** Embedding model provider override. */
    embeddingProvider?: ModelProvider
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: string
    /** Validated AI lane + model pick (Auto / Premium / BYOK). */
    ai?: AiJobSelection
    /** SCHEMA V2 only: programming language the learner chose (selects approachCriteria bucket). */
    lang?: string
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
    /** Embedding model id override. */
    embeddingModel?: string
    /** Embedding model provider override. */
    embeddingProvider?: ModelProvider
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: string
    /** Validated AI lane + model pick (Auto / Premium / BYOK). */
    ai?: AiJobSelection
}

/** Params for enqueuing a process-cv-submission job. */
export interface EnqueueProcessCvSubmissionJobParams {
    /** `users.id`. */
    userId: string
    /** `cv_submissions.id`. */
    cvSubmissionId: string
    /** Existing `jobs.id` to requeue (optional). */
    jobId?: string
    /** Embedding model id override. */
    embeddingModel?: string
    /** Embedding model provider override. */
    embeddingProvider?: ModelProvider
    /** Locale hint for filtering/prompting (e.g. "en", "vi"). */
    locale?: Locale
    /** `template_cvs.id` — which review rubric level to use. */
    templateCvId?: string
    /** `user_cv_submission_attempts.id` being reviewed. */
    cvSubmissionAttemptId?: string
    /** Validated AI lane + model pick (Auto / Premium / BYOK). */
    ai?: AiJobSelection
}

/**
 * Params for enqueueing a process-personal-project job.
 */
export interface EnqueueProcessPersonalProjectParams {
    /** Personal project attempt ID. */
    attemptId: string
    /** Branch to grade (defaults to "main"). */
    branch?: string
    /** User ID associated with the job. */
    userId: string
}

/**
 * Params for enqueueing a generate-personal-project-tasks job.
 */
export interface EnqueueGeneratePersonalProjectTasksParams {
    /** Enrollment ID — the user's enrollment to generate tasks for. */
    enrollmentId: string
    /** User ID associated with the job. */
    userId: string
    /** LLM model name override (e.g. "gpt-4o-mini"). */
    model?: string
    /** LLM provider override. */
    provider?: ModelProvider
    /** Locale hint for filtering/prompting. */
    locale?: Locale
}

/**
 * Params for enqueueing a resolve-github job.
 */
export interface EnqueueResolveGithubParams {
    /**
     * User ID to invite.
     */
    userId: string

    /**
     * Course ID used to resolve the GitHub team slug.
     * Optional when `teamSlug` is provided directly.
     */
    courseId?: string

    /**
     * Team slug override for direct enqueuing flows (e.g. OAuth callback).
     */
    teamSlug?: string

    /**
     * GitHub username to add to organization/team.
     */
    githubUsername: string
}

/**
 * Params for enqueueing a review-personal-project-task job.
 */
export interface EnqueueReviewPersonalProjectTaskParams {
    /** Enrollment ID. */
    enrollmentId: string
    /** GitHub URL submitted for review. */
    githubUrl: string
    /** Task ID to review. */
    taskId: string
    /** Branch to grade (defaults to "main"). */
    branch?: string
    /** User ID associated with the job. */
    userId: string
    /** Locale hint for filtering/prompting. */
    locale?: Locale
    /** Validated AI lane + model pick (Auto / Premium / BYOK). */
    ai?: AiJobSelection
}

/** Params accepted by EnqueueSyncScyllaDBJobService.enqueue. */
export type EnqueueSyncScyllaDBParams = SyncScyllaDBPayload

/** Params accepted by EnqueueSyncIndexerJobService.enqueue. */
export type EnqueueSyncIndexerParams = SyncIndexerPayload

/** Params accepted by EnqueueSyncElasticsearchJobService.enqueue. */
export type EnqueueSyncElasticsearchParams = SyncElasticsearchPayload

/** Params accepted by EnqueueSyncCdnJobService.enqueue. */
export type EnqueueSyncCdnParams = SyncCdnPayload

/**
 * Params accepted by {@link EnqueueSendMailJobService.enqueue}.
 *
 * Mirrors {@link SendMailPayload} — kept as a separate alias so we can
 * evolve the enqueue API (e.g. defaulting a `from` address) without
 * leaking transport concerns to callers.
 */
export type EnqueueSendMailParams = SendMailPayload

/** Params for enqueuing a judge-coding-submission job. */
export interface EnqueueJudgeCodingSubmissionJobParams {
    /** `users.id` — the submitter (job ownership / Socket.IO targeting). */
    userId: string
    /** `coding_submissions.id` to judge. */
    codingSubmissionId: string
    /** Existing `jobs.id` to requeue (optional). */
    jobId?: string
}