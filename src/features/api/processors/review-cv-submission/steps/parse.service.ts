import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    ReviewCvSubmissionAnalyzeStepExecuteResult,
} from "../types"

/**
 * Parses and validates the analyze-step JSON from the LLM (`detailFeedback` markdown).
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
            const detailFeedback = record.detailFeedback
            if (typeof detailFeedback !== "string" || !detailFeedback.trim()) {
                throw new Error(
                    "Missing or empty string field \"detailFeedback\".",
                )
            }
            return {
                detailFeedback: detailFeedback.trim(),
            }
        } catch (error) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text,
                originalError: error,
            })
        }
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
