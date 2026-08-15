import type {
    AiJobSelection,
} from "@modules/ai/types/ai-job-selection"
import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import type {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"

/**
 * Input to {@link CvScoringService.score} -- SOURCE-AGNOSTIC. The caller supplies
 * the CV either as `structuredData` (the composed CV JSON, used by the generate
 * pipeline) OR as `cvText` (extracted plain text, used by the upload pipeline in
 * WF-03c). At least one must be present; when both are given, the structured JSON
 * is preferred as the primary grading input and the text is appended as context.
 */
export interface ScoreCvParams {
    /** The acting user -- drives AI entitlement / lane routing. */
    userId: string
    /**
     * The composed CV JSON (header / summary / skills / experience / education).
     * Preferred grading input; used by the generate pipeline. Omit for a
     * text-only (uploaded) CV.
     */
    structuredData?: Record<string, unknown> | null
    /**
     * Extracted plain text of the CV. Used by the upload pipeline (WF-03c) and,
     * for a generated CV, may accompany `structuredData` as extra context.
     */
    cvText?: string | null
    /** Explicit seniority rubric level to grade against. */
    targetLevel: CvTargetLevel
    /** Effective output language, resolved before enqueue. */
    language: Locale
    /** The user's validated AI lane + model pick (Auto / Premium / BYOK). */
    selection?: AiJobSelection
}

/** Params for {@link CvScoringPromptService.build}. */
export interface BuildCvScoringPromptParams {
    /**
     * The composed CV JSON (header / summary / skills / experience / education).
     * Preferred grading input; used by the generate pipeline. Omit for a
     * text-only (uploaded) CV.
     */
    structuredData?: Record<string, unknown> | null
    /**
     * Extracted plain text of the CV. Used by the upload pipeline (WF-03c) and,
     * for a generated CV, may accompany `structuredData` as extra context.
     */
    cvText?: string | null
    /** Seniority rubric level to grade against. */
    level: CvTargetLevel
    /** Advisory rubric excerpt from `cv_rag`, or "" when retrieval failed. */
    rubricContext: string
    /** Human-readable output language for the LLM's feedback. */
    targetLanguage: string
}

/** Ordered production messages consumed by both scoring and its live harness. */
export interface BuildCvScoringPromptResult {
    messages: [SystemMessage, HumanMessage]
}

/** One structured feedback item on a CV (a strength or a gap). */
export interface CvScoreFeedbackItem {
    /** Severity of the observation (`low` | `medium` | `high`). */
    severity: string
    /** The rubric section this item relates to (e.g. "impact", "clarity"). */
    section: string
    /** Human-readable explanation of the strength / gap. */
    message: string
    /** Concrete suggested improvement, or `null` when already satisfied. */
    suggestion: string | null
}

/**
 * Structured AI feedback for a CV, persisted onto `cv_generations.feedback` as a
 * plain jsonb object. `Record<string, unknown>`-compatible so it drops straight
 * into the entity's jsonb column.
 */
export interface CvScoreFeedback {
    /** One-line summary of the CV's overall quality. */
    shortFeedback: string
    /** The rubric level the CV was graded against. */
    templateLevel: CvTargetLevel
    /** Per-observation feedback items (strengths + gaps). */
    items: Array<CvScoreFeedbackItem>
}

/**
 * Result of {@link CvScoringService.score}: the holistic 0-100 score plus the
 * structured feedback. `feedback` is widened to `Record<string, unknown>` so the
 * caller can assign it directly to the entity's jsonb column.
 */
export interface ScoreCvResult {
    /** Holistic CV score, clamped to the 0-100 range and integer-normalized. */
    score: number
    /** Structured feedback (assignable to `cv_generations.feedback`). */
    feedback: Record<string, unknown>
}

/**
 * Input to `ScoreUploadedCvService.scoreUploadedCv` -- the WF-07 upload-scoring
 * path. It targets a single unified `cv_generations` row (`source = uploaded`),
 * buffers its `uploadedCdnKey` from MinIO, extracts the text, and grades it with
 * the shared {@link CvScoringService} via the `cvText` branch (NOT
 * `structuredData`) -- the upload analogue of the generate score step.
 */
export interface ScoreUploadedCvParams {
    /** `cv_generations.id` of the uploaded CV row to grade + persist onto. */
    cvGenerationId: string
    /**
     * `users.id` -- owner of the row; drives AI entitlement / lane routing in the
     * shared scoring service.
     */
    userId: string
    /** Explicit seniority rubric level to grade against. */
    targetLevel: CvTargetLevel
    /** Effective output language. */
    language: Locale
    /** The user's validated AI lane + model pick (Auto / Premium / BYOK). */
    selection?: AiJobSelection
}
