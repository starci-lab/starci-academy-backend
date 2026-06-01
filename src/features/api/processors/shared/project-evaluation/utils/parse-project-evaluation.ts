import type {
    ProjectEvaluation,
} from "@modules/bullmq"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    extractJsonBlock,
    normalizeGradingScore,
} from "@modules/ai"

/**
 * Parse LLM JSON output into a {@link ProjectEvaluation}, normalizing the total score to an integer.
 *
 * @param text - Raw model output.
 * @returns Parsed project / milestone evaluation payload.
 */
export function parseProjectEvaluation(
    text: string,
): ProjectEvaluation {
    try {
        const parsed = JSON.parse(extractJsonBlock(text)) as ProjectEvaluation
        return {
            ...parsed,
            score: normalizeGradingScore(parsed.score),
        }
    } catch (error) {
        throw new ParsingCriteriaResultsFromModelTextException({
            text,
            originalError: error,
        })
    }
}
