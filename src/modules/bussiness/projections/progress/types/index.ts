/** Minimal transaction-manager surface the projector needs (just `query`). */
export interface ProgressTransactionManager {
    /** Run a raw parameterised SQL statement. */
    query: <T = unknown>(sql: string, parameters?: Array<unknown>) => Promise<T>
}

/** Params for recomputing a single user's course-progress projection. */
export interface RecomputeProgressParams {
    /** The user whose projection row to recompute. */
    userId: string
    /** The course the projection is scoped to. */
    courseId: string
    /**
     * Optional transaction manager. Pass the caller's tx manager to run the
     * UPSERT inside the same transaction (atomic + sees the just-written rows);
     * omit to use the service's own connection.
     */
    entityManager?: ProgressTransactionManager
}

/** Raw row shape returned from the leaderboard read (extracted from jsonb `value`). */
export interface LeaderboardRow {
    /** `enrollments.id` of the ranked enrollment. */
    enrollment_id: string
    /** `users.id` of the enrolled user. */
    user_id: string
    /** Display username, or `null` when the user has none. */
    username: string | null
    /** Avatar URL, or `null` when the user has none. */
    avatar: string | null
    /** Aggregated challenge score; string when returned as text from jsonb. */
    total_score: string | number
    /** Count of completed challenges; string when returned as text from jsonb. */
    completed_challenges: string | number
    /** Count of lessons marked read in the course; string when text. */
    lessons_read: string | number
    /** Count of milestone tasks passed in the course; string when text. */
    milestone_progress: string | number
    /** Total XP (challenge + reads×3 + milestone×10); string when text. */
    total_xp: string | number
}

/** Raw row for course-level totals (denominators). */
export interface CourseTotalsRow {
    /** Total number of challenges in the course; string when returned as `bigint`. */
    total_challenges: string | number
    /** Maximum achievable score across all challenges; `null` when there are no challenges. */
    max_possible_score: string | number | null
}

/** Raw row returned from the `getMyRank` read (extracted from jsonb `value`). */
export interface MyRankRow {
    /** `users.id` of the queried user. */
    user_id: string
    /** Aggregated challenge score; string when returned as text from jsonb. */
    total_score: string | number
    /** Count of completed challenges; string when returned as text from jsonb. */
    completed_challenges: string | number
    /** Count of lessons marked read in the course; string when text. */
    lessons_read: string | number
    /** Count of milestone tasks passed in the course; string when text. */
    milestone_progress: string | number
    /** Total XP (challenge + reads×3 + milestone×10); string when text. */
    total_xp: string | number
    /** Number of enrollments with a strictly higher total XP; string when `bigint`. */
    higher_count: string | number
}

/**
 * Generic Debezium CDC message envelope (after the unwrap SMT). The flat row
 * lives under `payload`; some configurations emit the row at the top level, so
 * the listener falls back to the whole object when `payload` is absent.
 */
export interface CdcEnvelope<TPayload> {
    /** The flat row image (column → value) when the unwrap SMT is configured. */
    payload?: TPayload
}

/** Row image for the `user_contents` CDC topic. */
export interface UserContentCdcRow {
    /** The user who read/favourited the content (snake_case from Postgres). */
    user_id?: string
    /** The content row that changed — used to derive the owning course. */
    content_id?: string
}

/** Row image for the `user_challenge_submission_attempts` CDC topic. */
export interface UserChallengeSubmissionAttemptCdcRow {
    /** FK to `user_challenge_submissions` — the join root for user + course. */
    user_challenge_submission_id?: string
}

/** Row image for the `user_milestone_task_attempts` CDC topic. */
export interface UserMilestoneTaskAttemptCdcRow {
    /** FK to `user_milestone_tasks` — the join root for enrollment → user + course. */
    user_milestone_task_id?: string
}

/** Row image for the `enrollments` CDC topic (user + course are direct columns). */
export interface EnrollmentCdcRow {
    /** The enrolled user. */
    user_id?: string
    /** The course the enrollment is for. */
    course_id?: string
}

/**
 * A single derived `(userId, courseId)` pair the projector should recompute,
 * resolved from a CDC row. `null` from a resolver means "cannot derive — skip".
 */
export interface DerivedProgressTarget {
    /** The user whose course projection must be recomputed. */
    userId: string
    /** The course the projection is scoped to. */
    courseId: string
}

/** Raw row returned by the `user_contents` → course lookup join. */
export interface ContentCourseLookupRow {
    /** `modules.course_id` of the content's owning module. */
    course_id: string
}

/**
 * Raw row returned by the `user_challenge_submission_attempts` → user + course
 * join (user_challenge_submissions → challenge_submissions → challenges →
 * contents → modules).
 */
export interface ChallengeAttemptTargetRow {
    /** `user_challenge_submissions.user_id` of the attempt's owner. */
    user_id: string
    /** `modules.course_id` reached via the submission → challenge → content chain. */
    course_id: string
}

/**
 * Raw row returned by the `user_milestone_task_attempts` → enrollment join
 * (user_milestone_tasks → enrollments).
 */
export interface MilestoneAttemptTargetRow {
    /** `enrollments.user_id` of the milestone-task's enrollment. */
    user_id: string
    /** `enrollments.course_id` of the milestone-task's enrollment. */
    course_id: string
}

/**
 * Raw row returned by the `getMyCourseProgress` read — one per course the viewer
 * is enrolled in (milestone completed read from the projection, total counted
 * live from the course's milestone tasks).
 */
export interface MyCourseProgressRow {
    /** `courses.id` of the enrolled course. */
    course_id: string
    /** Course title (the rail token label). */
    title: string
    /** Lessons read (from the projection); string when text. */
    content_completed: string | number
    /** Total contents (lessons) in the course; string when `bigint`. */
    content_total: string | number
    /** Challenges passed (from the projection); string when text. */
    challenge_completed: string | number
    /** Total challenges in the course; string when `bigint`. */
    challenge_total: string | number
    /** Milestone tasks passed (from the projection); string when text. */
    completed: string | number
    /** Total milestone tasks in the course; string when `bigint`. */
    total: string | number
}

/**
 * One course's milestone progress for the dashboard rail, returned by
 * {@link ProgressProjectionService.getMyCourseProgress}.
 */
export interface MyCourseProgressResult {
    /** `courses.id` of the enrolled course. */
    courseId: string
    /** Course title (the rail token label). */
    title: string
    /** Lessons the viewer has read in the course. */
    contentCompleted: number
    /** Total contents (lessons) in the course. */
    contentTotal: number
    /** Challenges the viewer has passed in the course. */
    challengeCompleted: number
    /** Total challenges in the course. */
    challengeTotal: number
    /** Milestone tasks the viewer has passed in the course. */
    completed: number
    /** Total milestone tasks in the course. */
    total: number
}

/**
 * Rank of a specific user within a course, returned by
 * {@link ProgressProjectionService.getMyRank} (typed view of the jsonb `value`).
 */
export interface GetMyRankResult {
    /** 1-based rank position within the course. */
    rank: number
    /** Aggregated challenge score for the user. */
    totalScore: number
    /** Number of challenges the user has completed. */
    completedChallenges: number
    /** Number of lessons the user has marked read in the course. */
    lessonsRead: number
    /** Number of milestone tasks the user has passed in the course. */
    milestoneProgress: number
    /** Total XP for the user (challenge + reads×3 + milestone×10) — drives rank. */
    totalXp: number
}
