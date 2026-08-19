import {
    Injectable,
} from "@nestjs/common"
import {
    extractJsonBlock,
} from "@modules/ai/utils/extract-json-block"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/platform/exceptions/errors/ai/parsing-criteria-results-from-model-text"
import {
    MockInterviewVerdict,
    type MockInterviewAttributeScore,
    type MockInterviewGradeSessionResult,
    type MockInterviewPhaseScore,
} from "./types/mock-interview-grade"

/** One normalized per-question feedback item reported by the provider. */
export interface MockInterviewQuestionFeedbackItem {
    index: number
    feedback: string
}

/** One normalized checkpoint-coverage item reported by the provider. */
export interface MockInterviewCoveredCheckpointItem {
    index: number
    covered: Array<number>
}

/** The provider-reported fields {@link ParsedMockInterviewGrade} adds on top of the persisted result shape. */
export interface ParsedMockInterviewGradeExtras {
    questionFeedback: Array<MockInterviewQuestionFeedbackItem>
    coveredCheckpoints: Array<MockInterviewCoveredCheckpointItem>
}

/** Provider-backed fields before business-owned RAG links and question reviews are attached. */
export type ParsedMockInterviewGrade = Omit<
MockInterviewGradeSessionResult,
"matchedContentIds" | "questionReviews"
> & ParsedMockInterviewGradeExtras

const MIN_SCORE = 0
const MAX_SCORE = 100
const DEFAULT_PHASE_MAX = 100
const PASS_SCORE_THRESHOLD = 75
const BORDERLINE_SCORE_THRESHOLD = 50

@Injectable()
/** Normalizes only the provider's JSON scorecard; it performs no scoring or persistence. */
export class GradeMockInterviewSessionParseService {
    /** Parse a provider response into the tolerant scorecard shape used by grading. */
    parse(
        raw: string,
    ): ParsedMockInterviewGrade {
        let parsed: Record<string, unknown>
        try {
            parsed = JSON.parse(extractJsonBlock(raw)) as Record<string, unknown>
        } catch (error) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text: raw,
                originalError: error instanceof Error
                    ? error
                    : undefined,
            })
        }

        const overallScore = this.normalizeScore(parsed.overallScore)
        return {
            overallScore,
            verdict: this.normalizeVerdict(parsed.verdict,
                overallScore),
            phaseScores: this.normalizePhaseScores(parsed.phaseScores),
            attributeScores: this.normalizeAttributeScores(parsed.attributeScores),
            strengths: this.normalizeStringArray(parsed.strengths),
            gaps: this.normalizeStringArray(parsed.gaps),
            followUpQuestion: this.normalizeNullableString(parsed.followUpQuestion),
            questionFeedback: this.normalizeQuestionFeedback(parsed.questionFeedback),
            coveredCheckpoints: this.normalizeCoveredCheckpoints(parsed.coveredCheckpoints),
        }
    }

    /** Normalize a provider or persisted verdict, deriving it from score on a miss. */
    normalizeVerdict(
        value: unknown,
        scoreFallback: number,
    ): MockInterviewVerdict {
        const candidate = typeof value === "string"
            ? value.trim().toLowerCase()
            : ""
        const match = Object.values(MockInterviewVerdict).find(
            (verdict) => verdict === candidate,
        )
        if (match) {
            return match
        }
        if (scoreFallback >= PASS_SCORE_THRESHOLD) {
            return MockInterviewVerdict.Pass
        }
        if (scoreFallback >= BORDERLINE_SCORE_THRESHOLD) {
            return MockInterviewVerdict.Borderline
        }
        return MockInterviewVerdict.Fail
    }

    /** Normalize provider phase rows into bounded renderable values. */
    normalizePhaseScores(
        value: unknown,
    ): Array<MockInterviewPhaseScore> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
            .map((item) => {
                const phase = typeof item.phase === "string"
                    ? item.phase
                    : ""
                const maxRaw = typeof item.max === "number"
                    ? item.max
                    : Number(item.max)
                const max = Number.isFinite(maxRaw) && maxRaw > 0
                    ? maxRaw
                    : DEFAULT_PHASE_MAX
                const scoreRaw = typeof item.score === "number"
                    ? item.score
                    : Number(item.score)
                const score = Number.isFinite(scoreRaw)
                    ? Math.min(max,
                        Math.max(MIN_SCORE,
                            Math.round(scoreRaw)))
                    : MIN_SCORE
                return {
                    phase,
                    score,
                    max,
                }
            })
            .filter((item) => item.phase.length > 0)
    }

    /** Normalize provider attribute rows into bounded values. */
    normalizeAttributeScores(
        value: unknown,
    ): Array<MockInterviewAttributeScore> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
            .map((item) => ({
                key: typeof item.key === "string"
                    ? item.key
                    : "",
                score: this.normalizeScore(item.score),
            }))
            .filter((item) => item.key.length > 0)
    }

    /** Normalize a provider array into trimmed, non-empty strings. */
    normalizeStringArray(
        value: unknown,
    ): Array<string> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
    }

    private normalizeScore(
        value: unknown,
    ): number {
        const numeric = typeof value === "number"
            ? value
            : Number(value)
        if (!Number.isFinite(numeric)) {
            return MIN_SCORE
        }
        return Math.min(MAX_SCORE,
            Math.max(MIN_SCORE,
                Math.round(numeric)))
    }

    private normalizeQuestionFeedback(
        value: unknown,
    ): Array<MockInterviewQuestionFeedbackItem> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
            .map((item) => ({
                index: this.normalizeIndex(item.index),
                feedback: typeof item.feedback === "string"
                    ? item.feedback.trim()
                    : "",
            }))
            .filter((item) => item.index >= 0)
    }

    private normalizeCoveredCheckpoints(
        value: unknown,
    ): Array<MockInterviewCoveredCheckpointItem> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
            .map((item) => ({
                index: this.normalizeIndex(item.index),
                covered: Array.isArray(item.covered)
                    ? item.covered
                        .map(Number)
                        .filter((entry) => Number.isFinite(entry) && entry >= 0)
                        .map((entry) => Math.trunc(entry))
                    : [],
            }))
            .filter((item) => item.index >= 0)
    }

    private normalizeIndex(
        value: unknown,
    ): number {
        const numeric = typeof value === "number"
            ? value
            : Number(value)
        return Number.isFinite(numeric)
            ? Math.max(0,
                Math.trunc(numeric))
            : -1
    }

    private normalizeNullableString(
        value: unknown,
    ): string | null {
        if (typeof value !== "string") {
            return null
        }
        const trimmed = value.trim()
        return trimmed.length > 0
            ? trimmed
            : null
    }
}
