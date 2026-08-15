import {
    Injectable,
} from "@nestjs/common"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CvRagRetrievalService,
} from "@modules/integrations/rag/cv-rag-retrieval.service"
import {
    CvScoringInputMissingException,
} from "@modules/platform/exceptions/errors/cv/cv-scoring-input-missing"
import {
    parseCvScore,
} from "./utils/parse-cv-score"
import type {
    ScoreCvParams,
    ScoreCvResult,
} from "./types"
import type {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import {
    CvScoringPromptService,
} from "./cv-scoring-prompt.service"

/** Number of rubric RAG chunks to pull for the scoring prompt. */
const RUBRIC_RAG_TOP_K = 4

@Injectable()
/**
 * SOURCE-AGNOSTIC CV scoring service. The ONE reusable place that turns a CV --
 * regardless of whether it was AI-generated (`structuredData`) or user-uploaded
 * (`cvText`) -- into a holistic `{ score 0-100, feedback }` against a single
 * seniority rubric (parameterized by `templateLevel`).
 *
 * It knows NOTHING about the CV's source: callers pass the CV content and get a
 * grade back. The generate pipeline (WF-03b) feeds `structuredData`; the upload
 * pipeline (WF-03c) will feed `cvText` -- both hit this same method, so the score
 * is produced by one rubric in one place.
 *
 * Routes the AI call through the same lane the CV-generation pipeline uses
 * (`AiModelTask.CVGenerating`, floor Balanced, Grading surface) via
 * {@link AiInvokeService.run}, so scoring is billed / gated exactly like the
 * other CV tasks. Rubric context comes from the persistent `cv_rag` collection
 * ({@link CvRagRetrievalService}) -- advisory, so a RAG miss never fails scoring.
 */
export class CvScoringService {
    constructor(
        private readonly aiInvokeService: AiInvokeService,
        private readonly cvRagRetrievalService: CvRagRetrievalService,
        private readonly cvScoringPromptService: CvScoringPromptService,
    ) {}

    /**
     * Score a CV against the rubric and return the holistic score + feedback.
     *
     * @param params - {@link ScoreCvParams} (source-agnostic: `structuredData` or `cvText`).
     * @returns {@link ScoreCvResult} -- 0-100 score + jsonb-assignable feedback.
     * @throws When neither `structuredData` nor `cvText` is provided, or the
     * model reply cannot be parsed into a score.
     */
    async score(
        {
            userId,
            structuredData,
            cvText,
            targetLevel,
            language,
            selection,
        }: ScoreCvParams,
    ): Promise<ScoreCvResult> {
        const hasStructuredData = structuredData
            ? Object.keys(structuredData).length > 0
            : false
        const hasCvText = Boolean(cvText?.trim())
        if (!hasStructuredData && !hasCvText) {
            throw new CvScoringInputMissingException({
            })
        }

        const targetLanguage = language === Locale.Vi
            ? "Vietnamese (Tiếng Việt)"
            : "English"

        // advisory rubric context (best-effort -- a miss degrades to no context)
        const rubricContext = await this.buildRubricContext(targetLevel)

        const { messages } = this.cvScoringPromptService.build({
            structuredData,
            cvText,
            level: targetLevel,
            rubricContext,
            targetLanguage,
        })

        // ONE shared entry -- same lane/policy shape as the CV-generation compose
        // step (task CVGenerating, floor Balanced, Grading surface). The generate
        // pipeline does not debit credit on its LLM calls, so scoring mirrors that
        // (no consume here) -- it rides the same lane routing as the other CV tasks.
        const { text: raw } = await this.aiInvokeService.run({
            userId,
            messages,
            selection,
            floor: AiModelCategory.Medium,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.CVGenerating,
        })

        return parseCvScore(raw,
            targetLevel)
    }

    /**
     * Retrieve rubric reference chunks for the target level from the `cv_rag`
     * collection. Best-effort: any failure yields an empty context so scoring
     * proceeds against the inline rubric alone.
     */
    private async buildRubricContext(
        level: CvTargetLevel,
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

}
