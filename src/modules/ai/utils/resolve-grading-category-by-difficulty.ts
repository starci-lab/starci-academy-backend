import {
    AiModelCategory,
} from "@modules/databases"

/**
 * Grading model ladder, cheapest → strongest. `Free` is intentionally EXCLUDED:
 * grading never runs the free chatbot models (it bills, and free is 0-cost
 * chatbot-only). The ladder is the routable space for grading.
 */
const GRADING_LADDER: Array<AiModelCategory> = [
    AiModelCategory.Economy,
    AiModelCategory.Balanced,
    AiModelCategory.Premium,
]

/**
 * Category each difficulty WANTS before clamping to the user's entitlement.
 * Harder task → stronger model (Cursor-style complexity routing). Unknown /
 * null difficulty is treated as `medium`.
 */
const DIFFICULTY_TARGET_CATEGORY: Record<string, AiModelCategory> = {
    easy: AiModelCategory.Economy,
    medium: AiModelCategory.Economy,
    hard: AiModelCategory.Balanced,
    insane: AiModelCategory.Premium,
    expert: AiModelCategory.Premium,
}

/**
 * Pick the grading model category for a task by its difficulty, CLAMPED to the
 * categories the user's tier unlocks.
 *
 * - Harder task → wants a stronger category (easy/medium → Economy, hard →
 *   Balanced, insane/expert → Premium).
 * - The wanted category is then clamped DOWN to the highest the user is entitled
 *   to: a free-tier learner (Economy ceiling) always grades on Economy even for
 *   an insane task; a Max-tier learner gets the full difficulty-driven choice.
 * - Always returns at least Economy (the grading floor).
 *
 * @param params - the task `difficulty` (nullable) and the user's `allowedCategories`.
 * @returns the single grading category to use.
 */
export const resolveGradingCategoryByDifficulty = (
    {
        difficulty,
        allowedCategories,
    }: {
        difficulty?: string | null
        allowedCategories: Array<AiModelCategory>
    },
): AiModelCategory => {
    const want = DIFFICULTY_TARGET_CATEGORY[(difficulty ?? "medium").toLowerCase()]
        ?? AiModelCategory.Economy
    // the grading-relevant subset the user is entitled to (Free excluded)
    const allowedLadder = GRADING_LADDER.filter((category) =>
        allowedCategories.includes(category))
    if (allowedLadder.length === 0) {
        return AiModelCategory.Economy
    }
    // clamp down: highest entitled category not exceeding the wanted tier
    const wantRank = GRADING_LADDER.indexOf(want)
    for (let rank = wantRank; rank >= 0; rank--) {
        if (allowedLadder.includes(GRADING_LADDER[rank])) {
            return GRADING_LADDER[rank]
        }
    }
    return allowedLadder[0]
}
