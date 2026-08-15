import {
    Injectable,
} from "@nestjs/common"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    CV_LEVEL_EXPECTATIONS,
    CV_SCORE_MAX,
    CV_SCORE_MIN,
    CV_SCORE_OUTPUT_TEMPLATE,
} from "./constants"
import type {
    BuildCvScoringPromptParams,
    BuildCvScoringPromptResult,
} from "./types"

@Injectable()
/** Pure builder for the ordered CV-scoring system and human messages. */
export class CvScoringPromptService {
    /**
     * Build the exact production messages without performing RAG, routing, or parsing.
     *
     * @param params - CV content, rubric context, level, and output language.
     * @returns Ordered system and human messages.
     */
    build(
        {
            structuredData,
            cvText,
            level,
            rubricContext,
            targetLanguage,
        }: BuildCvScoringPromptParams,
    ): BuildCvScoringPromptResult {
        const cvContent = this.buildCvContent({
            structuredData,
            cvText,
        })
        const systemText = [
            `You are a strict, experienced technical recruiter grading a ${level}-level engineer's CV.`,
            "",
            "## Task",
            "Grade the CV holistically against the rubric below and produce a single 0-100 score plus structured feedback.",
            "Judge impact (quantified outcomes), clarity, relevant skills, structure, and evidence of real work.",
            "Do NOT reward fabricated or vague claims; reward concrete, verifiable achievements.",
            "",
            `## Level expectations (${level})`,
            CV_LEVEL_EXPECTATIONS[level],
            ...(rubricContext.trim().length > 0
                ? [
                    "",
                    "## Reference rubric",
                    rubricContext,
                ]
                : []),
            "",
            "## IMPORTANT: Language",
            `Write ALL human-readable feedback values (shortFeedback, message, suggestion) in **${targetLanguage}**. JSON keys stay in English.`,
            "",
            `## Scoring (scale ${CV_SCORE_MIN}-${CV_SCORE_MAX})`,
            `- ${CV_SCORE_MIN} = unusable; ${CV_SCORE_MAX} = exceptional for the level.`,
            "- Anchor to the level expectations above — a strong junior CV is not a strong senior CV.",
            "",
            "## Output Format",
            "Respond with a SINGLE JSON object matching this shape exactly (replace the placeholder strings):",
            "",
            JSON.stringify(CV_SCORE_OUTPUT_TEMPLATE,
                null,
                2),
            "",
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- `items` may have any length; use an empty array only when there is genuinely nothing to note.",
        ].join("\n")
        const humanText = [
            "Below is the CV to grade:",
            "",
            cvContent,
        ].join("\n")

        return {
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
        }
    }

    private buildCvContent(
        {
            structuredData,
            cvText,
        }: Pick<BuildCvScoringPromptParams, "structuredData" | "cvText">,
    ): string {
        const parts: Array<string> = []
        if (structuredData && Object.keys(structuredData).length > 0) {
            parts.push(
                "## Structured CV (JSON)",
                JSON.stringify(structuredData,
                    null,
                    2),
            )
        }
        const trimmedText = cvText?.trim()
        if (trimmedText && trimmedText.length > 0) {
            parts.push(
                "## CV text",
                trimmedText,
            )
        }
        return parts.join("\n\n")
    }
}
