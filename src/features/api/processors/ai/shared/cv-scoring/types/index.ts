import type {
    AiJobSelection,
} from "@modules/ai"
import type {
    Locale,
} from "@modules/databases"

/**
 * Seniority rubric level the CV is graded against. Kept as a string union
 * (`junior` | `mid` | `senior`) rather than an enum so a caller can pass a value
 * inferred from any signal (target role, verified achievement volume) without a
 * hard dependency on a shared enum. Defaults to `mid` when omitted.
 */
export type CvTemplateLevel = "junior" | "mid" | "senior"

/**
 * Input to {@link CvScoringService.score} — SOURCE-AGNOSTIC. The caller supplies
 * the CV either as `structuredData` (the composed CV JSON, used by the generate
 * pipeline) OR as `cvText` (extracted plain text, used by the upload pipeline in
 * WF-03c). At least one must be present; when both are given, the structured JSON
 * is preferred as the primary grading input and the text is appended as context.
 */
export interface ScoreCvParams {
    /** The acting user — drives AI entitlement / lane routing. */
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
    /** Seniority rubric level to grade against (defaults to `mid`). */
    templateLevel?: CvTemplateLevel
    /** Locale hint so feedback is written in the learner's language. */
    locale?: Locale
    /** The user's validated AI lane + model pick (Auto / Premium / BYOK). */
    selection?: AiJobSelection
}

/** Params for {@link CvScoringService.buildCvContent}. */
export interface BuildCvContentParams {
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
}

/** Params for {@link CvScoringService.buildSystemPrompt}. */
export interface BuildSystemPromptParams {
    /** Seniority rubric level to grade against. */
    level: CvTemplateLevel
    /** Advisory rubric excerpt from `cv_rag`, or "" when retrieval failed. */
    rubricContext: string
    /** Human-readable output language for the LLM's feedback. */
    targetLanguage: string
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
    templateLevel: CvTemplateLevel
    /** Per-observation feedback items (strengths + gaps). */
    items: Array<CvScoreFeedbackItem>
}

/**
 * Result of {@link CvScoringService.score}: the holistic 0–100 score plus the
 * structured feedback. `feedback` is widened to `Record<string, unknown>` so the
 * caller can assign it directly to the entity's jsonb column.
 */
export interface ScoreCvResult {
    /** Holistic CV score, clamped to the 0–100 range and integer-normalized. */
    score: number
    /** Structured feedback (assignable to `cv_generations.feedback`). */
    feedback: Record<string, unknown>
}

/**
 * Input to `ScoreUploadedCvService.scoreUploadedCv` — the WF-07 upload-scoring
 * path. It targets a single unified `cv_generations` row (`source = uploaded`),
 * buffers its `uploadedCdnKey` from MinIO, extracts the text, and grades it with
 * the shared {@link CvScoringService} via the `cvText` branch (NOT
 * `structuredData`) — the upload analogue of the generate score step.
 */
export interface ScoreUploadedCvParams {
    /** `cv_generations.id` of the uploaded CV row to grade + persist onto. */
    cvGenerationId: string
    /**
     * `users.id` — owner of the row; drives AI entitlement / lane routing in the
     * shared scoring service.
     */
    userId: string
    /** Seniority rubric level to grade against (defaults to `mid` when omitted). */
    templateLevel?: CvTemplateLevel
    /** Locale hint so feedback is written in the learner's language. */
    locale?: Locale
    /** The user's validated AI lane + model pick (Auto / Premium / BYOK). */
    selection?: AiJobSelection
}
