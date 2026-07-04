/**
 * Raw aggregate row from the UNION-safe best-CV-score query — `GREATEST` of the
 * unified `cv_generations` max and the legacy `cv_submission_attempts` max for a
 * user. Postgres `GREATEST`/`MAX` over an `int` column comes back as a numeric
 * `string`; `null` only if the query returned no row at all.
 */
export interface MaxCvScoreRow {
    /** Highest recorded score across the user's unified + legacy CVs, or `null` if the query returned no row. */
    max: string | null
}
