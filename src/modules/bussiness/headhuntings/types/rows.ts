/**
 * Raw aggregate row from the best-CV-score query — `MAX(cv_generations.score)`
 * for a user. Postgres `MAX` over an `int` column comes back as a numeric
 * `string`; `null` only if the query returned no row at all.
 */
export interface MaxCvScoreRow {
    /** Highest recorded score across the user's unified CVs, or `null` if the query returned no row. */
    max: string | null
}
