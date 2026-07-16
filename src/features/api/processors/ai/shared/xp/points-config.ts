/**
 * Flat, course-agnostic reward **Points** granted per action — the universal
 * "effort" currency, distinct from per-course weighted **XP** (`xp_histories.amount`).
 *
 * Every action is worth the SAME number of points at every course, so any
 * cross-course total (the dashboard "this week" widget, the weekly league) is
 * fair regardless of how big a course's XP pool is. XP stays weighted + per-course
 * for in-course leaderboards; Points is flat + global for momentum + league.
 *
 * (Kept as a constant — mirrors the existing hard-coded XP amounts like
 * `LESSON_READ_XP` / `MILESTONE_PASS_XP`. Promote to `app.yaml` if ops needs to
 * tune it without a deploy.)
 */
export const FLAT_POINTS = {
    /** Reading a lesson/content for the first time. */
    lessonRead: 5,
    /** Passing a challenge — flat, NOT the raw challenge score. */
    challengePassed: 20,
    /** Passing a milestone (personal-project) task. */
    milestonePassed: 30,
    /**
     * Solving a coding-practice problem (first clean Accepted solve, no reveal).
     * The flat reward credited to `coin_balance`; the XP `amount` for a coding
     * solve is the problem's own point value (see the judge step).
     */
    codingSolved: 20,
    /**
     * Completing a flashcard quiz session (anchored to `lessonRead` — a
     * "finish a study unit" action; grind is self-limiting since it only pays
     * on the session's XP-earning slice, capped at `DAILY_QUIZ_XP_CAP`/day).
     */
    flashcardQuizSession: 5,
    /**
     * Grading one flashcard for the FIRST time ever (once per user × card).
     * Deliberately the smallest flat reward — lowest-effort, highest-volume
     * action, bounded only by total distinct cards (not a renewable faucet).
     */
    flashcardFirstReview: 1,
} as const
