import type {
    ChallengeEvaluation,
} from "@modules/integrations/bullmq/types/evaluation/challenge-evaluation"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/platform/exceptions/errors/ai/parsing-criteria-results-from-model-text"
import {
    extractJsonBlock,
} from "@modules/ai/utils/extract-json-block"
import {
    normalizeGradingScore,
} from "@modules/ai/utils/normalize-grading-score"
import type {
    ResolvedChallengeCriterion,
} from "../../challenge-submission/types/criteria"
import {
    SubmissionFeedbackSeverity,
} from "@modules/databases/postgresql/primary/enums/submission-feedback-severity"

/** Frozen rubric and source medium used to validate and canonicalize AI evidence. */
export interface ParseChallengeEvaluationOptions {
    criteria: Array<ResolvedChallengeCriterion>
    source: "code" | "document"
}

const VALID_SEVERITIES = new Set(["low",
    "medium",
    "high"])

function validateAndCanonicalize(
    parsed: ChallengeEvaluation,
    options: ParseChallengeEvaluationOptions,
): ChallengeEvaluation {
    if (typeof parsed.shortFeedback !== "string" || !Array.isArray(parsed.details)) {
        throw new ParsingCriteriaResultsFromModelTextException({
            text: JSON.stringify(parsed),
        })
    }
    if (parsed.details.length !== options.criteria.length) {
        throw new ParsingCriteriaResultsFromModelTextException({
            text: JSON.stringify(parsed),
        })
    }
    let evidencePoints = 0
    let failedCritical = false
    let canonicalScore = 0
    const details = parsed.details.map((detail, index) => {
        if (detail.criteriaId !== String(index) || typeof detail.met !== "boolean") {
            throw new ParsingCriteriaResultsFromModelTextException({
                text: JSON.stringify(parsed),
            })
        }
        if (!Array.isArray(detail.feedbacks) || detail.feedbacks.length === 0) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text: JSON.stringify(parsed),
            })
        }
        const feedbacks = detail.feedbacks.map((feedback) => {
            // Models commonly mirror the rubric's CRITICAL marker as a feedback
            // severity. Product feedback has only three presentation levels, so
            // canonicalize that provider variation at the model boundary instead
            // of discarding an otherwise complete evaluation.
            const rawSeverity = feedback.severity as string
            const severity = rawSeverity === "critical"
                ? SubmissionFeedbackSeverity.High
                : feedback.severity
            if (!VALID_SEVERITIES.has(severity)
                || typeof feedback.message !== "string"
                || feedback.message.trim().length === 0) {
                throw new ParsingCriteriaResultsFromModelTextException({
                    text: JSON.stringify(parsed),
                })
            }
            return {
                ...feedback,
                severity,
            }
        })
        const criterion = options.criteria[index]
        if (detail.met) {
            canonicalScore += criterion.score
        } else if (criterion.critical) {
            failedCritical = true
        }
        const hasConcreteEvidence = feedbacks.some((feedback) =>
            typeof feedback.location === "string" && feedback.location.trim().length > 0)
        // A negative finding can legitimately prove absence (for example an empty
        // repository), where a file:line location cannot exist. Its explicit
        // explanatory message is evidence; positive claims still require a
        // concrete source location.
        const hasEvaluativeEvidence = hasConcreteEvidence || (!detail.met && feedbacks.some(
            (feedback) => feedback.message.trim().length > 0,
        ))
        const hasRecoveryAdvice = detail.met || feedbacks.some((feedback) =>
            typeof feedback.suggestion === "string" && feedback.suggestion.trim().length > 0)
        evidencePoints += Number(hasEvaluativeEvidence) + Number(hasRecoveryAdvice)
        return {
            ...detail,
            feedbacks,
        }
    })
    if (failedCritical) canonicalScore = 0
    const confidence = options.criteria.length === 0
        ? 0
        : evidencePoints / (options.criteria.length * 2)
    return {
        ...parsed,
        score: canonicalScore,
        details,
        confidence,
    }
}

/**
 * Parse LLM JSON output into a {@link ChallengeEvaluation}, normalizing the total score to an integer.
 *
 * @param text - Raw model output (optional ```json fence stripped inside).
 * @returns Parsed and validated challenge evaluation payload.
 */
export function parseChallengeEvaluation(
    text: string,
    options?: ParseChallengeEvaluationOptions,
): ChallengeEvaluation {
    try {
        const parsed = JSON.parse(extractJsonBlock(text)) as ChallengeEvaluation
        const normalized = {
            ...parsed,
            score: normalizeGradingScore(parsed.score),
        }
        return options ? validateAndCanonicalize(normalized,
            options) : normalized
    } catch (error) {
        throw new ParsingCriteriaResultsFromModelTextException({
            text,
            originalError: error,
        })
    }
}
