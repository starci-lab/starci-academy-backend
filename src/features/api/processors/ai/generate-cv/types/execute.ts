import {
    EmptyObject,
} from "@modules/common"

/** Params for {@link import("../steps/extract-cv-text").extractCvText}. */
export interface ExtractCvTextParams {
    /** Raw bytes of the uploaded source CV file. */
    buffer: Buffer
    /** The file's MinIO object key -- its extension selects the extractor. */
    key: string
}

/** Params for {@link import("../steps/generate-cv-compose-step.service").GenerateCvComposeStepService.buildRagContext}. */
export interface BuildRagContextParams {
    /** Rough seniority signal, steers the rubric/sample queries. */
    inferredLevel: string
    /** Inferred target role, steers the sample-phrasing query. */
    inferredRole: string
    /** Tech-stack hint, steers the skill-catalog query. */
    techStack: Array<string>
}

/** Params for {@link import("../steps/generate-cv-compose-step.service").GenerateCvComposeStepService.buildSystemPrompt}. */
export interface BuildSystemPromptParams {
    /** Human-readable output language for the LLM's response. */
    targetLanguage: string
    /** The user's free-text emphasis/target-role notes. */
    extraPrompts: string
    /** Concatenated RAG excerpts (rubric / catalog / sample), or "" when retrieval failed. */
    ragContext: string
    /** Rough seniority signal from {@link BuildRagContextParams.inferredLevel}. */
    inferredLevel: string
    /** Inferred target role from {@link BuildRagContextParams.inferredRole}. */
    inferredRole: string
    /** Whether this run is revising an uploaded CV rather than generating from scratch. */
    isRevise: boolean
}

/** One PASSED milestone/capstone task attempt, flattened for the CV prompt. */
export interface GatheredMilestoneTaskAttempt {
    taskTitle: string
    milestoneTitle: string
    courseTitle: string
    score: number
}

/** One graded challenge submission attempt (score > 0), flattened for the CV prompt. */
export interface GatheredChallengeSubmission {
    challengeTitle: string
    courseTitle: string
    score: number
    submissionUrl: string | null
    selectedLang: string | null
}

/** One accepted coding-practice submission, flattened for the CV prompt. */
export interface GatheredCodingSolve {
    problemTitle: string
    difficulty: string
    domain: string
}

/** Verified profile fields pulled from `users` for the CV header/contact block. */
export interface GatheredUserProfile {
    displayName: string | null
    bio: string | null
    roleTitle: string | null
    location: string | null
    linkedinUrl: string | null
    websiteUrl: string | null
    githubUsername: string | null
    workMode: string | null
    openToWork: boolean
}

/** Per-source XP totals -- a signal for which skill categories to emphasize. */
export interface GatheredXpBreakdown {
    challengeXp: number
    milestoneXp: number
    codingXp: number
    lessonXp: number
}

/**
 * Result of the gather step: all VERIFIED achievements + profile the learner has
 * earned, plus (for `Revise`) the extracted text of the uploaded source CV.
 * Persisted as this step's execution result and read by the compose step.
 */
export interface GenerateCvGatherStepExecuteResult {
    profile: GatheredUserProfile
    milestoneTaskAttempts: Array<GatheredMilestoneTaskAttempt>
    challengeSubmissions: Array<GatheredChallengeSubmission>
    codingSolves: Array<GatheredCodingSolve>
    xp: GatheredXpBreakdown
    /** Extracted plain text of the uploaded source CV (Revise mode only). */
    sourceCvText: string | null
}

/** One skill category with its items (e.g. "Backend" -> ["NestJS", "PostgreSQL"]). */
export interface ComposedSkillGroup {
    category: string
    items: Array<string>
}

/** One experience/project entry with achievement bullets. */
export interface ComposedExperience {
    title: string
    org: string
    location: string
    dateRange: string
    bullets: Array<string>
}

/** Education entry. */
export interface ComposedEducation {
    school: string
    degree: string
    dateRange: string
}

/**
 * Structured CV produced by the compose step's LLM call (STRICT JSON parsed +
 * validated). Persisted as the compose step result and rendered to LaTeX by the
 * render step; also written back to `cv_generations.structured_data`.
 */
export interface GenerateCvComposeStepExecuteResult {
    fullName: string
    headline: string
    summary: string
    skillGroups: Array<ComposedSkillGroup>
    experiences: Array<ComposedExperience>
    education: Array<ComposedEducation>
}

/**
 * Result of the render step: the MinIO object key of the generated `.tex` file,
 * plus the object key of its compiled PDF (`tectonic`) when the compile
 * succeeded -- `null` when it failed (degrades to the `.tex` download). Persisted
 * as the render step result; the complete step copies both to
 * `cv_generations.latex_cdn_key` / `generated_pdf_cdn_key`.
 */
export interface GenerateCvRenderStepExecuteResult {
    latexCdnKey: string
    pdfCdnKey: string | null
}

/**
 * Result of the score step: the holistic 0-100 score + structured feedback the
 * shared {@link CvScoringService} produced from the composed CV. Persisted as the
 * score step result; the complete step copies both onto `cv_generations`.
 */
export interface GenerateCvScoreStepExecuteResult {
    /** Holistic CV score (0-100), or `null` when scoring degraded gracefully. */
    score: number | null
    /** Structured AI feedback (jsonb-assignable), or `null` when unavailable. */
    feedback: Record<string, unknown> | null
}

/** Result of the generate-cv complete step. */
export type GenerateCvCompleteStepExecuteResult = EmptyObject
