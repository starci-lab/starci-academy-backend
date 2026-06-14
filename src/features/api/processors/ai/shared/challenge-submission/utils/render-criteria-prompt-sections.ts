import type {
    ResolvedChallengeCriterion,
} from "../types"

/**
 * Render the criteria list into the LLM prompt sections (one block per criterion).
 *
 * @param criteria - The resolved criteria to render.
 * @returns A markdown string listing every criterion with its index, score and critical flag.
 */
export function renderCriteriaPromptSections(
    criteria: Array<ResolvedChallengeCriterion>,
): string {
    return criteria
        .map(
            (criterion, index) => {
                const criticalTag = criterion.critical ? " (CRITICAL)" : ""
                return [
                    `### Criterion ${index} [${criterion.kind}]${criticalTag} (maxScore: ${criterion.score})`,
                    criterion.body,
                ].join("\n")
            },
        )
        .join("\n\n")
}
