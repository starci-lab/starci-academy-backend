import {
    Injectable,
} from "@nestjs/common"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    AiInvokeService,
} from "@modules/ai"
import {
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
    Locale,
} from "@modules/databases"
import {
    CvRagRetrievalService,
} from "@modules/rag"
import {
    CvScoringInputMissingException,
} from "@modules/exceptions"
import {
    CV_LEVEL_EXPECTATIONS,
    CV_SCORE_MAX,
    CV_SCORE_MIN,
    CV_SCORE_OUTPUT_TEMPLATE,
    DEFAULT_CV_TEMPLATE_LEVEL,
} from "./constants"
import {
    parseCvScore,
} from "./utils"
import type {
    CvTemplateLevel,
    ScoreCvParams,
    ScoreCvResult,
} from "./types"

/** Number of rubric RAG chunks to pull for the scoring prompt. */
const RUBRIC_RAG_TOP_K = 4

/**
 * SOURCE-AGNOSTIC CV scoring service. The ONE reusable place that turns a CV —
 * regardless of whether it was AI-generated (`structuredData`) or user-uploaded
 * (`cvText`) — into a holistic `{ score 0–100, feedback }` against a single
 * seniority rubric (parameterized by `templateLevel`).
 *
 * It knows NOTHING about the CV's source: callers pass the CV content and get a
 * grade back. The generate pipeline (WF-03b) feeds `structuredData`; the upload
 * pipeline (WF-03c) will feed `cvText` — both hit this same method, so the score
 * is produced by one rubric in one place.
 *
 * Routes the AI call through the same lane the CV-generation pipeline uses
 * (`AiModelTask.CVGenerating`, floor Balanced, Grading surface) via
 * {@link AiInvokeService.run}, so scoring is billed / gated exactly like the
 * other CV tasks. Rubric context comes from the persistent `cv_rag` collection
 * ({@link CvRagRetrievalService}) — advisory, so a RAG miss never fails scoring.
 */
@Injectable()
export class CvScoringService {
    constructor(
        private readonly aiInvokeService: AiInvokeService,
        private readonly cvRagRetrievalService: CvRagRetrievalService,
    ) {}

    /**
     * Score a CV against the rubric and return the holistic score + feedback.
     *
     * @param params - {@link ScoreCvParams} (source-agnostic: `structuredData` or `cvText`).
     * @returns {@link ScoreCvResult} — 0–100 score + jsonb-assignable feedback.
     * @throws When neither `structuredData` nor `cvText` is provided, or the
     * model reply cannot be parsed into a score.
     */
    async score(
        {
            userId,
            structuredData,
            cvText,
            templateLevel,
            locale,
            selection,
        }: ScoreCvParams,
    ): Promise<ScoreCvResult> {
        const level: CvTemplateLevel = templateLevel ?? DEFAULT_CV_TEMPLATE_LEVEL
        const cvContent = this.buildCvContent({
            structuredData,
            cvText,
        })
        if (!cvContent) {
            throw new CvScoringInputMissingException({
            })
        }

        const targetLanguage = (locale ?? Locale.En) === Locale.Vi
            ? "Vietnamese (Tiếng Việt)"
            : "English"

        // advisory rubric context (best-effort — a miss degrades to no context)
        const rubricContext = await this.buildRubricContext(level)

        const systemText = this.buildSystemPrompt({
            level,
            rubricContext,
            targetLanguage,
        })
        const humanText = [
            "Below is the CV to grade:",
            "",
            cvContent,
        ].join("\n")

        // ONE shared entry — same lane/policy shape as the CV-generation compose
        // step (task CVGenerating, floor Balanced, Grading surface). The generate
        // pipeline does not debit credit on its LLM calls, so scoring mirrors that
        // (no consume here) — it rides the same lane routing as the other CV tasks.
        const { text: raw } = await this.aiInvokeService.run({
            userId,
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
            selection,
            floor: AiModelCategory.Medium,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.CVGenerating,
        })

        return parseCvScore(raw,
            level)
    }

    /**
     * Build the CV content block fed to the model. Prefers the structured JSON
     * (pretty-printed) as the primary input; appends the extracted text as extra
     * context when both are present; falls back to the text alone otherwise.
     * Returns `""` when neither yields content.
     */
    private buildCvContent(
        {
            structuredData,
            cvText,
        }: {
            structuredData?: Record<string, unknown> | null
            cvText?: string | null
        },
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

    /**
     * Retrieve rubric reference chunks for the target level from the `cv_rag`
     * collection. Best-effort: any failure yields an empty context so scoring
     * proceeds against the inline rubric alone.
     */
    private async buildRubricContext(
        level: CvTemplateLevel,
    ): Promise<string> {
        try {
            const { excerpt } = await this.cvRagRetrievalService.retrieveCvContext({
                query: `CV quality rubric and scoring expectations for a ${level} engineer`,
                kinds: [
                    "rubric",
                ],
                topK: RUBRIC_RAG_TOP_K,
            })
            return excerpt
        } catch {
            return ""
        }
    }

    /**
     * Build the grading system prompt: role, the level's expectation bar, the
     * (advisory) rubric RAG context, the scoring scale, and the STRICT-JSON
     * output contract.
     */
    private buildSystemPrompt(
        {
            level,
            rubricContext,
            targetLanguage,
        }: {
            level: CvTemplateLevel
            rubricContext: string
            targetLanguage: string
        },
    ): string {
        return [
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
    }
}
