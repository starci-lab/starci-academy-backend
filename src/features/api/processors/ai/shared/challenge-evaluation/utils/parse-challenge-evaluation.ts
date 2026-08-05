import type {
    ChallengeEvaluation,
} from "@modules/bullmq"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    extractJsonBlock,
} from "@modules/ai/utils/extract-json-block"
import {
    normalizeGradingScore,
} from "@modules/ai/utils/normalize-grading-score"

/**
 * Parse LLM JSON output into a {@link ChallengeEvaluation}, normalizing the total score to an integer.
 *
 * @param text - Raw model output (optional ```json fence stripped inside).
 * @returns Parsed and validated challenge evaluation payload.
 */
export function parseChallengeEvaluation(
    text: string,
): ChallengeEvaluation {
    try {
        const parsed = JSON.parse(extractJsonBlock(text)) as ChallengeEvaluation
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
