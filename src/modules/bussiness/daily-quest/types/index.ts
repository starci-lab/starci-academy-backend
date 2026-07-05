import type {
    DailyQuestKey,
} from "@modules/databases"

/**
 * One code-defined daily-quest task. Targets + reward live in code (no DB table)
 * so the quest definition is a single source of truth that ships with the build.
 */
export interface DailyQuestTaskDefinition {
    /** Which task this is. */
    key: DailyQuestKey
    /** How many of the action are required today to count the task done. */
    target: number
}

/**
 * One daily-quest task resolved against TODAY's activity: the `current` progress
 * vs the static `target`.
 */
export interface DailyQuestTaskResult {
    /** Which task this is. */
    key: DailyQuestKey
    /** How many of the action the user has done today. */
    current: number
    /** How many are required today. */
    target: number
}

/**
 * The viewer's daily quest for today: each task's progress, whether everything is
 * done, whether the reward was already claimed, and the reward value on claim.
 */
export interface DailyQuestResult {
    /** Today's Asia/Ho_Chi_Minh calendar day (YYYY-MM-DD). */
    date: string
    /** Each daily task with its current progress + target. */
    tasks: Array<DailyQuestTaskResult>
    /** True when every task's current >= target. */
    allDone: boolean
    /** True when the reward was already claimed today. */
    claimed: boolean
    /** Points granted when the completed quest is claimed. */
    reward: number
}

/**
 * Result of a successful daily-quest claim: the user's refreshed Coin
 * balance.
 */
export interface ClaimDailyQuestResult {
    /** Coin balance after the grant. */
    balance: number
}

/**
 * One raw aggregate row from the "today" per-type count query. Postgres returns
 * `count(*)` as a numeric string over the wire, so every field is a string.
 */
export interface DailyQuestTodayCountsRow {
    /** Lessons read today (xp_histories source `lessonRead`), as a numeric string. */
    lessonsToday: string
    /** Challenges passed today (xp_histories source `challenge`), as a numeric string. */
    challengesToday: string
    /** Flashcards reviewed today (user_flashcard_reviews), as a numeric string. */
    flashcardsToday: string
}

/**
 * One raw row holding today's Asia/Ho_Chi_Minh calendar date (`YYYY-MM-DD`).
 */
export interface DailyQuestTodayDateRow {
    /** Today's VN calendar day as text. */
    today: string
}

/**
 * One raw row from the "already claimed today" existence check.
 */
export interface DailyQuestClaimedRow {
    /** 1 when a completion row exists for the user + day, else 0 (numeric string). */
    claimed: string
}
