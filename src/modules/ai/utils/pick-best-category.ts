import {
    AiModelCategory,
} from "@modules/databases"

/** Rank used to pick the "best" category a Premium tier unlocks. */
const CATEGORY_RANK: Record<AiModelCategory, number> = {
    [AiModelCategory.Economy]: 0,
    [AiModelCategory.Balanced]: 1,
    [AiModelCategory.Premium]: 2,
}

/**
 * Pick the highest-ranked category from the allowed list (economy < balanced
 * < premium). Falls back to Economy when the list is empty.
 * @param categories - Categories the tier currently unlocks.
 * @returns The single best category to grade with.
 */
export const pickBestCategory = (
    categories: Array<AiModelCategory>,
): AiModelCategory => {
    return categories.reduce(
        (best, candidate) =>
            (CATEGORY_RANK[candidate] > CATEGORY_RANK[best] ? candidate : best),
        AiModelCategory.Economy,
    )
}
