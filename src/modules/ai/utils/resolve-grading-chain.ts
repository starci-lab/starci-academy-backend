import {
    AiModelCategory,
} from "@modules/databases"

/**
 * Category ladder, cheapest → strongest. The Auto lane climbs this in order
 * from a `floor` up to the user's tier ceiling.
 */
export const CATEGORY_LADDER: Array<AiModelCategory> = [
    AiModelCategory.Free,
    AiModelCategory.Economy,
    AiModelCategory.Balanced,
    AiModelCategory.Premium,
    AiModelCategory.Frontier,
]

/**
 * Floor category a grading run STARTS from, by task difficulty. Harder task →
 * higher floor. Unknown / null difficulty → Economy (the grading floor).
 */
const DIFFICULTY_FLOOR: Record<string, AiModelCategory> = {
    easy: AiModelCategory.Economy,
    medium: AiModelCategory.Balanced,
    hard: AiModelCategory.Premium,
    insane: AiModelCategory.Frontier,
    expert: AiModelCategory.Frontier,
}

/**
 * Resolve the grading floor category from a task difficulty.
 *
 * @param difficulty - the task difficulty (nullable).
 * @returns the floor category (Economy when unknown).
 */
export const gradingFloorForDifficulty = (
    difficulty?: string | null,
): AiModelCategory => {
    return DIFFICULTY_FLOOR[(difficulty ?? "").toLowerCase()]
        ?? AiModelCategory.Economy
}

/**
 * Build the ordered category chain the Auto lane runs: from `floor` UP to the
 * effective ceiling (climb on exhaustion, never below the floor).
 *
 * - `chain = ladder[floor..top] ∩ tierCategories`, additionally capped at `ceil`
 *   when given (ascending = climb order).
 * - When the floor is above the ceiling (e.g. an `insane` task on a free tier
 *   capped at Economy), clamp down to the single highest entitled category at or
 *   above Economy.
 * - Always returns at least `[Economy]`.
 *
 * @param params - the `floor` to start from, the user's `tierCategories`
 *   (plan ceiling), and an optional `ceil` (user-set per-feature cap).
 * @returns the ordered category chain.
 */
export const resolveGradingChain = (
    {
        floor,
        tierCategories,
        ceil,
    }: {
        floor: AiModelCategory
        tierCategories: Array<AiModelCategory>
        ceil?: AiModelCategory | null
    },
): Array<AiModelCategory> => {
    const floorRank = CATEGORY_LADDER.indexOf(floor)
    // optional user-set cap (per hạng mục in settings): never climb past `ceil`
    const ceilRank = ceil ? CATEGORY_LADDER.indexOf(ceil) : CATEGORY_LADDER.length - 1
    const chain = CATEGORY_LADDER.filter(
        (category, rank) =>
            rank >= floorRank
            && rank <= ceilRank
            && tierCategories.includes(category),
    )
    if (chain.length > 0) {
        return chain
    }
    // floor above ceiling → clamp to the highest entitled GRADING category (≥ Economy)
    const economyRank = CATEGORY_LADDER.indexOf(AiModelCategory.Economy)
    const allowedGrading = CATEGORY_LADDER.filter(
        (category, rank) => rank >= economyRank && tierCategories.includes(category),
    )
    return allowedGrading.length > 0
        ? [allowedGrading[allowedGrading.length - 1]]
        : [AiModelCategory.Economy]
}
