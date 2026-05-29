/**
 * Interface for the enrollment to be passed around.
 */
export interface ProgressEnrollmentType {
    /** The course ID. */
    courseId: string
    /** The enrollment ID. */
    enrollmentId: string
}

/** Raw row shape returned from the leaderboard aggregate query. */
export interface LeaderboardRow {
    /** `enrollments.id` of the ranked enrollment. */
    enrollment_id: string
    /** `users.id` of the enrolled user. */
    user_id: string
    /** Display username, or `null` when the user has none. */
    username: string | null
    /** Avatar URL, or `null` when the user has none. */
    avatar: string | null
    /** Aggregated challenge score; string when returned as `bigint`, number otherwise. */
    total_score: string | number
    /** Count of completed challenges; string when returned as `bigint`, number otherwise. */
    completed_challenges: string | number
    /** Count of lessons marked read in the course; string when `bigint`. */
    lessons_read: string | number
    /** Count of milestone tasks passed in the course; string when `bigint`. */
    milestone_progress: string | number
    /** Total XP (challenge + reads×3 + milestone×10); string when `bigint`. */
    total_xp: string | number
}

/** Raw row for course-level totals (denominators). */
export interface CourseTotalsRow {
    /** Total number of challenges in the course; string when returned as `bigint`. */
    total_challenges: string | number
    /** Maximum achievable score across all challenges; `null` when there are no challenges. */
    max_possible_score: string | number | null
}

/** Raw row returned from the `getMyRank` aggregate query. */
export interface MyRankRow {
    /** `users.id` of the queried user. */
    user_id: string
    /** Aggregated challenge score; string when returned as `bigint`, number otherwise. */
    total_score: string | number
    /** Count of completed challenges; string when returned as `bigint`, number otherwise. */
    completed_challenges: string | number
    /** Count of lessons marked read in the course; string when `bigint`. */
    lessons_read: string | number
    /** Count of milestone tasks passed in the course; string when `bigint`. */
    milestone_progress: string | number
    /** Total XP (challenge + reads×3 + milestone×10); string when `bigint`. */
    total_xp: string | number
    /** Number of enrollments with a strictly higher total XP; string when `bigint`. */
    higher_count: string | number
}

/**
 * Rank of a specific user within a course, returned by
 * {@link LeaderboardService.getMyRank}.
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