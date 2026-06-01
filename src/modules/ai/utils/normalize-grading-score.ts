/**
 * Coerce a grading score to a non-negative integer for PostgreSQL `int` columns and GraphQL `Int`.
 * Rounds away floating-point noise (e.g. `99.99999999999999` → `100`).
 *
 * @param score - Raw score from the model or a weighted sum of per-criterion points.
 * @returns A whole number suitable for persistence.
 */
export function normalizeGradingScore(score: number): number {
    if (!Number.isFinite(score)) {
        return 0
    }
    return Math.max(0,
        Math.round(score))
}
