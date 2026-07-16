/**
 * Shared types for the learner self-management CMS read services — plain
 * paginated lists keyed by the current user (the LIST exception, so no CQRS
 * projection). Each service returns a typed `{ items, total }` view that the
 * GraphQL resolvers map 1:1 onto their response object types.
 */

/** Params for any of the learner-CMS paginated reads (one page for one user). */
export interface ListLearnerCmsParams {
    /** The user whose rows to page over. */
    userId: string
    /** Page size (already clamped to a sane ceiling by the resolver). */
    limit: number
    /** Number of rows to skip before the page (already floored at 0). */
    offset: number
}

/**
 * A page of rows plus the unfiltered total for the user — the common envelope
 * every learner-CMS read returns so resolvers can expose `{ items, total }`.
 */
export interface PaginatedLearnerCmsResult<TItem> {
    /** The rows for the requested page (already ordered newest-first). */
    items: Array<TItem>
    /** Total number of rows for the user, ignoring the page window. */
    total: number
}

/**
 * One of the user's challenge-submission attempts, flattened with its challenge
 * title and the course it belongs to (resolved via challenge → content → module
 * → course). The course id is the raw UUID; the resolver wraps it into the
 * opaque global id the FE feeds to `resolveRoute`.
 */
export interface ChallengeSubmissionAttemptResult {
    /** Attempt row id (primary key of `user_challenge_submission_attempts`). */
    id: string
    /** Title of the challenge (falls back to the submission requirement title). */
    challengeTitle: string
    /** Title of the owning course. */
    courseTitle: string
    /** Raw UUID of the owning course (resolver turns it into the global id). */
    courseId: string
    /** Verdict bucket — "passed" | "failed" | "pending". */
    status: string
    /** Score achieved in this attempt (0 when not yet graded). */
    score: number
    /** Language the user chose for the submission, or null (V1 submissions). */
    selectedLang: string | null
    /** The submitted source link (GitHub repo / Google Docs URL), or null. */
    submissionUrl: string | null
    /** When the attempt was created (used as the "submitted at" timestamp). */
    submittedAt: Date
}

/**
 * One of the user's milestone-task review attempts, flattened with its task,
 * milestone, and course titles (resolved via attempt → user_milestone_task →
 * milestone_task → milestone, course via the enrollment).
 */
export interface MilestoneTaskAttemptResult {
    /** Attempt row id (primary key of `user_milestone_task_attempts`). */
    id: string
    /** Title of the milestone task. */
    taskTitle: string
    /** Title of the parent milestone. */
    milestoneTitle: string
    /** Title of the owning course. */
    courseTitle: string
    /** Raw UUID of the owning course (resolver turns it into the global id). */
    courseId: string
    /** Whether the review attempt passed. */
    passed: boolean
    /** Score achieved in this attempt. */
    score: number
    /** When the attempt was created (used as the "attempted at" timestamp). */
    attemptedAt: Date
}

/**
 * One merged learning-feedback row from either source (challenge submission
 * feedback or milestone-task attempt feedback). Already normalised to the
 * same shape so the resolver can return a single list.
 */
export interface LearningFeedbackResult {
    /** Source bucket — "challenge" | "task". */
    source: string
    /** Short human title (challenge / task title). */
    title: string
    /** Owning course title. */
    courseTitle: string | null
    /** The feedback message / summary text. */
    summary: string
    /** When the feedback row was created. */
    createdAt: Date
}

/** Raw single-row count returned by the learner-CMS count queries. */
export interface CountRow {
    /** Total row count as a text-encoded bigint (postgres COUNT). */
    total: string
}

/** Raw page row for a challenge-submission attempt (snake_case SQL columns). */
export interface ChallengeSubmissionAttemptRow {
    /** Attempt primary key. */
    id: string
    /** Challenge title (falls back to the submission requirement title). */
    challenge_title: string
    /** Owning course title (null only for orphaned V1 rows). */
    course_title: string
    /** Owning course UUID (null only for orphaned V1 rows). */
    course_id: string
    /** Attempt score, or null when not yet graded. */
    score: number | null
    /** When grading finished, or null while pending. */
    processed_at: Date | null
    /** Language chosen for the submission, or null. */
    selected_lang: string | null
    /** Submitted source link, or null. */
    submission_url: string | null
    /** Attempt creation time (the "submitted at" timestamp). */
    submitted_at: Date
}

/** Raw page row for a milestone-task attempt (snake_case SQL columns). */
export interface MilestoneTaskAttemptRow {
    /** Attempt primary key. */
    id: string
    /** Milestone task title. */
    task_title: string
    /** Parent milestone title. */
    milestone_title: string
    /** Owning course title. */
    course_title: string
    /** Owning course UUID. */
    course_id: string
    /** Whether the attempt passed. */
    passed: boolean
    /** Attempt score. */
    score: number
    /** Attempt creation time (the "attempted at" timestamp). */
    attempted_at: Date
}

/** Raw merged feedback row across both sources (snake_case SQL columns). */
export interface LearningFeedbackRow {
    /** Source bucket — "challenge" | "task". */
    source: string
    /** Short human title. */
    title: string
    /** Owning course title. */
    course_title: string | null
    /** Feedback message / summary text. */
    summary: string
    /** Feedback creation time. */
    created_at: Date
}
