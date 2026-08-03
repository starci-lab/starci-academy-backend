/** Cached per-user coding-practice progress/status (decoupled from the catalog). */
export interface CodingProblemProgressCacheResult {
    /** Problem ids the user has at least one Accepted submission for. */
    solvedProblemIds: Array<string>
    /** Problem ids the user has submitted to (any verdict). */
    attemptedProblemIds: Array<string>
    /** Problem ids whose reference solution the user has revealed. */
    revealedProblemIds: Array<string>
    /** Cumulative coding points earned by the user (`users.coding_points`). */
    totalPoints: number
}
