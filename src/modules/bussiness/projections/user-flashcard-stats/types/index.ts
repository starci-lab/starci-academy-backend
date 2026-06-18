import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing one user's flashcard-stats projection row. */
export interface RecomputeUserFlashcardStatsParams {
    /** The user whose flashcard stats to rebuild. */
    userId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** Params for reading one user's flashcard stats. */
export interface UserFlashcardStatsParams {
    /** The user whose flashcard stats to read. */
    userId: string
}

/**
 * A user's flashcard study stats, derived from the `flashcard_review_events` log.
 */
export interface UserFlashcardStatsResult {
    /** Consecutive days (VN) reviewed up to today/yesterday; 0 if the run lapsed. */
    currentStreak: number
    /** Longest-ever run of consecutive review days (VN). */
    longestStreak: number
    /** Percent of reviews recalled (grade >= 2, i.e. Good/Easy), 0–100. */
    retentionRate: number
    /** Total reviews ever graded. */
    totalReviewed: number
    /** ISO timestamp of the most recent review, or null when never reviewed. */
    lastReviewedAt: string | null
}

/**
 * CDC row from `flashcard_review_events` — a new review moves the reviewer's
 * stats. Only the reviewer's `user_id` is needed to derive the recompute target.
 */
export interface FlashcardReviewEventCdcRow {
    /** The reviewer's user id. */
    user_id?: string
}

/** One review-history row read during recompute: its VN date + the grade. */
export interface ReviewHistoryRow {
    /** Review date in Asia/Ho_Chi_Minh, as `YYYY-MM-DD`. */
    day: string
    /** SM-2 grade given (0=Again … 3=Easy). */
    grade: number
}

/** Meta row read during recompute: today (VN) + the latest review timestamp. */
export interface ReviewMetaRow {
    /** Today's date in Asia/Ho_Chi_Minh, as `YYYY-MM-DD`. */
    today: string
    /** ISO timestamp of the latest review, or null when none. */
    last_reviewed_at: string | null
}
