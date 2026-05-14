import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    ReviewCvSubmissionAnalyzeStepExecuteResult,
} from "../types"

const SCORE_MIN = 0
const SCORE_MAX = 100

/**
 * Parses and validates the analyze-step JSON from the LLM (`feedbackDetails` + `score`).
 */
@Injectable()
export class ReviewCvSubmissionParseService {
    /**
     * @param text - Raw model output (optional ```json fence stripped).
     * @returns Validated execution result for the analyze step.
     */
    parse(
        text: string,
    ): ReviewCvSubmissionAnalyzeStepExecuteResult {
        const trimmed = text.trim()
        const payload = this.stripOptionalMarkdownFence(trimmed)
        try {
            const parsed: unknown = JSON.parse(payload)
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                throw new Error("Model JSON must be a single object.")
            }
            const record = parsed as Record<string, unknown>
            const fromFeedback = record.feedbackDetails
            const fromLegacy = record.detailFeedback
            const detailSource = typeof fromFeedback === "string" && fromFeedback.trim()
                ? fromFeedback
                : typeof fromLegacy === "string" && fromLegacy.trim()
                    ? fromLegacy
                    : null
            if (!detailSource) {
                throw new Error(
                    "Missing or empty markdown field \"feedbackDetails\" (or legacy \"detailFeedback\").",
                )
            }
            const score = this.parseScore(record.score)
            return {
                detailFeedback: detailSource.trim(),
                score,
            }
        } catch (error) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text,
                originalError: error,
            })
        }
    }

    private parseScore(
        raw: unknown,
    ): number | null {
        if (raw === undefined || raw === null) {
            return null
        }
        const n = typeof raw === "number"
            ? raw
            : typeof raw === "string" && raw.trim() !== ""
                ? Number(raw)
                : NaN
        if (!Number.isFinite(n)) {
            throw new Error("Field \"score\" must be a finite number (0–100).")
        }
        return Math.round(
            Math.min(
                SCORE_MAX,
                Math.max(
                    SCORE_MIN,
                    n,
                ),
            ),
        )
    }

    private stripOptionalMarkdownFence(
        text: string,
    ): string {
        const match = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/m.exec(
            text,
        )
        return match ? match[1].trim() : text
    }
}
