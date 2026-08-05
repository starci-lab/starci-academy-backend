import type {
    ProjectEvaluation,
} from "@modules/integrations/bullmq/types/evaluation/project-evaluation"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/platform/exceptions/errors/ai/parsing-criteria-results-from-model-text"
import {
    extractJsonBlock,
} from "@modules/ai/utils/extract-json-block"
import {
    normalizeGradingScore,
} from "@modules/ai/utils/normalize-grading-score"

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
