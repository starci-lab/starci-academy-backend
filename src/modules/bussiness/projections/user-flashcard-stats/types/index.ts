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

/** Params for reading a user's trailing daily flashcard-review activity window. */
export interface UserFlashcardDailyActivityParams {
    /** The user whose activity to read. */
    userId: string
    /** Trailing window length, in VN-calendar days (e.g. 14). */
    days: number
}

/**
 * One day's flashcard-review activity — cards graded that VN-calendar day,
 * zero-filled for rest days by the read-time windowing so it reads as a "did
 * I study each day" consistency series. GLOBAL per-user (mirrors the streak):
 * a habit signal spans all courses, and `flashcard_review_events` carries no
 * course anyway.
 */
export interface FlashcardDailyActivityPoint {
    /** The VN-calendar day (`YYYY-MM-DD`). */
    date: string
    /** Cards graded that day across every deck/mode (0 = rest day). */
    cardsReviewed: number
}

/**
 * Tally of graded reviews by SM-2 grade (0=Again, 1=Hard, 2=Good, 3=Easy),
 * across the SAME history scan {@link UserFlashcardStatsResult.retentionRate}
 * is derived from — no extra query.
 */
export interface FlashcardGradeDistribution {
    /** Reviews graded "Again" (0) — forgotten. */
    again: number
    /** Reviews graded "Hard" (1) — recalled with difficulty. */
    hard: number
    /** Reviews graded "Good" (2) — recalled normally. */
    good: number
    /** Reviews graded "Easy" (3) — recalled effortlessly. */
    easy: number
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
    /** Tally of graded reviews by SM-2 grade. */
    gradeDistribution: FlashcardGradeDistribution
}

/**
 * The FULL persisted projection `value` — the read stats above PLUS a bounded
 * per-VN-day count map (`YYYY-MM-DD` → cards graded that day) that powers the
 * daily-activity chart. Kept in the SAME projection row (no new table): the
 * existing CDC listener already recomputes it on every review event, and the
 * read-time window slice (see `getDailyActivity`) avoids rolling-window drift.
 */
export interface PersistedUserFlashcardStatsValue extends UserFlashcardStatsResult {
    /** Cards graded per VN day (`YYYY-MM-DD` → count), retained for a bounded window. */
    dailyReviewCounts: Record<string, number>
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
