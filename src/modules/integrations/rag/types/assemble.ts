/**
 * Result of assembling retrieved chunk contents into a single excerpt while
 * respecting a hard character budget.
 */
export interface AssembleWithinBudgetResult {
    /** The joined chunk contents, never exceeding the character budget. */
    excerpt: string
    /** Whether the final chunk was clipped because it would overflow the budget. */
    truncated: boolean
    /** How many chunks contributed to the excerpt (partial chunk counts as one). */
    count: number
}
