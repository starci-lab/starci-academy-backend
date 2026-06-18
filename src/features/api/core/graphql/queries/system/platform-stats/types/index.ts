/**
 * Raw row shape for the `COUNT(DISTINCT user_id)` learners aggregate.
 */
export interface DistinctLearnersRow {
    /** Distinct learner count as returned by Postgres (string from the driver). */
    count: string
}
