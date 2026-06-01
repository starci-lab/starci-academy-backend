import type {
    ChallengeEvaluation,
} from "@modules/bullmq"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    extractJsonBlock,
    normalizeGradingScore,
} from "@modules/ai"

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
