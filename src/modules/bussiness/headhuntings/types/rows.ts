/**
 * Raw aggregate row from the `MAX(score)` query over a user's CV attempts.
 * Postgres `MAX()` over a nullable `int` column comes back as `string | null`.
 */
export interface MaxCvScoreRow {
    /** Highest recorded score across the user's CV attempts, or `null` if none have a score yet. */
    max: string | null
}
