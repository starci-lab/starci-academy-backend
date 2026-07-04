import {
    extractJsonBlock,
    normalizeGradingScore,
} from "@modules/ai"
import {
    CV_SCORE_MAX,
    CV_SCORE_MIN,
} from "../constants"
import type {
    CvScoreFeedback,
    CvScoreFeedbackItem,
    CvTemplateLevel,
    ScoreCvResult,
} from "../types"

/** Coerce an unknown value to a trimmed string (empty string when not a string). */
const asString = (value: unknown): string =>
    typeof value === "string" ? value.trim() : ""

/** Coerce an unknown value to a string, or `null` when absent/empty. */
const asNullableString = (value: unknown): string | null => {
    const text = asString(value)
    return text.length > 0 ? text : null
}

/**
 * Parse the scoring model's STRICT-JSON reply into a {@link ScoreCvResult}
 * (mirrors {@link parseChallengeEvaluation}: extract the JSON block, `JSON.parse`,
 * coerce fields). The holistic score is clamped to 0–100 and integer-normalized;
 * feedback items are shape-coerced defensively so a partially-malformed reply
 * still yields a persistable result.
 *
 * @param text - Raw model output (optional ```json fence stripped inside).
 * @param templateLevel - The rubric level the CV was graded against (echoed into feedback).
 * @returns The parsed 0–100 score + structured feedback (jsonb-assignable).
 */
export const parseCvScore = (
    text: string,
    templateLevel: CvTemplateLevel,
): ScoreCvResult => {
    let parsed: Record<string, unknown>
    try {
        parsed = JSON.parse(extractJsonBlock(text)) as Record<string, unknown>
    } catch (error) {
        throw new Error(
            `Failed to parse CV score JSON from model output: ${
                error instanceof Error ? error.message : String(error)
            }`,
        )
    }

    // clamp to the rubric range, then integer-normalize for the `int` column
    const rawScore = typeof parsed.score === "number" ? parsed.score : Number(parsed.score)
    const clampedScore = Math.min(
        CV_SCORE_MAX,
        Math.max(
            CV_SCORE_MIN,
            Number.isFinite(rawScore) ? rawScore : CV_SCORE_MIN,
        ),
    )

    const items: Array<CvScoreFeedbackItem> = Array.isArray(parsed.items)
        ? (parsed.items as Array<Record<string, unknown>>).map((item) => ({
            severity: asString(item?.severity) || "low",
            section: asString(item?.section),
            message: asString(item?.message),
            suggestion: asNullableString(item?.suggestion),
        }))
        : []

    const feedback: CvScoreFeedback = {
        shortFeedback: asString(parsed.shortFeedback),
        templateLevel,
        items,
    }

    return {
        score: normalizeGradingScore(clampedScore),
        // widen to the jsonb column shape
        feedback: feedback as unknown as Record<string, unknown>,
    }
}
