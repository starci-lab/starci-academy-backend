/** Shape of a single leaderboard entry for a course. */
export interface CourseLeaderboardEntry {
    /** Enrollment ID. */
    enrollmentId: string
    /** User ID. */
    userId: string
    /** Username snapshot for display (may be null in DB). */
    username: string | null
    /** Avatar URL snapshot. */
    avatar: string | null
    /** Total score across all challenges in the course (sum of best attempts per submission). */
    totalScore: number
    /** Number of challenges fully completed (challenge score == max). */
    completedChallenges: number
    /** Number of lessons (contents) the user has marked as read in this course. */
    lessonsRead: number
    /** Number of milestone tasks passed (>=1 passed attempt) in this course. */
    milestoneProgress: number
    /** Total XP = challenge score + lessonsReadx3 + milestoneProgressx10 (drives rank). */
    totalXp: number
    /** 1-based rank position within the cached top window. */
    rank: number
}

/** Cached leaderboard payload for a course. */
export interface CourseLeaderboardCacheResult {
    /** Course ID this leaderboard belongs to. */
    courseId: string
    /** Total challenges in the course (denominator for completion ratio). */
    totalChallenges: number
    /** Maximum possible total score (sum of challenge max scores). */
    maxPossibleScore: number
    /** Top entries, sorted by totalXp DESC then createdAt ASC. */
    entries: Array<CourseLeaderboardEntry>
    /** When this snapshot was computed. */
    computedAt: Date
}
