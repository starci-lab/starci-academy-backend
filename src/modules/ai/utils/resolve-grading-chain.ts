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
 * The one category every automatic grading run uses, whatever the task's
 * difficulty.
 *
 * Difficulty used to pick the rung (easy → Economy … insane → Frontier). It no
 * longer does: every graded submission — easy through insane, challenge through
 * interview — runs on the same workhorse model, because grading marks a
 * submission against a rubric that the prompt already spells out, which a
 * mid-priced model does as well as a frontier one at a fraction of the cost.
 *
 * The stronger `Frontier` model is reachable ONLY by pinning it explicitly
 * (`selection.model`, the premium lane). Nothing automatic ever escalates into
 * it — see {@link resolveGradingChain}, which caps the climb here.
 */
export const GRADING_FLOOR_CATEGORY = AiModelCategory.Balanced

/** Rank of {@link GRADING_FLOOR_CATEGORY} in {@link CATEGORY_LADDER}. */
const GRADING_CEILING_RANK = CATEGORY_LADDER.indexOf(GRADING_FLOOR_CATEGORY)

/**
 * Build the ordered category chain the Auto lane runs: from `floor` up to the
 * effective ceiling, which never exceeds {@link GRADING_FLOOR_CATEGORY}.
 *
 * - `chain = ladder[floor..ceiling] ∩ tierCategories` (ascending = climb order).
 * - The ceiling is capped at {@link GRADING_FLOOR_CATEGORY} even when the user's
 *   plan (or their own `ceil` setting) would allow more, so an automatic run can
 *   never escalate into the frontier model on its own.
 * - When nothing survives the intersection, fall back to the grading category
 *   rather than an empty chain, which would fail the run outright.
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
    // a user-set cap can only lower the ceiling, never raise it past the
    // automatic grading category
    const requestedCeilRank = ceil
        ? CATEGORY_LADDER.indexOf(ceil)
        : GRADING_CEILING_RANK
    const ceilRank = Math.min(requestedCeilRank,
        GRADING_CEILING_RANK)
    const chain = CATEGORY_LADDER.filter(
        (category, rank) =>
            rank >= floorRank
            && rank <= ceilRank
            && tierCategories.includes(category),
    )
    if (chain.length > 0) {
        return chain
    }
    return [GRADING_FLOOR_CATEGORY]
}
