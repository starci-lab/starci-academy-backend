import {
    ModelProvider,
} from "@modules/databases"

/**
 * AI model recommendation tier -- controls cost vs quality trade-off.
 */
export enum ModelRecommendation {
    /** Cheapest models -- suitable for development/testing. */
    Low = "low",
    /** Balanced cost/quality -- suitable for staging. */
    Medium = "medium",
    /** Best quality models -- suitable for production. */
    High = "high",
}

/**
 * A resolved model choice: model name + provider.
 */
export interface ModelChoice {
    /** LLM model name (e.g. "gpt-4o-mini", "gemini-2.0-flash"). */
    model: string
    /** Provider that serves this model. */
    provider: ModelProvider
}

/**
 * Task kinds for the AI router -- each has its own model tier matrix.
 */
export enum AiTaskKind {
    /** Grading code submissions (git, Google Docs). */
    Grade = "grade",
    /** Generating personalized project milestones. */
    GenerateMilestone = "generateMilestone",
    /** Reviewing personal project tasks. */
    ReviewPersonalProject = "reviewPersonalProject",
    /** CV submission review pipeline (extract -> plan -> analyze). */
    ReviewCvSubmission = "reviewCvSubmission",
}

/**
 * Inputs to the catalog ranking score -- the recorded metrics a model row
 * carries. Extended by adding a field here and a factor in `computeModelWeight`.
 */
export interface ComputeModelWeightParams {
    /** USD charged per million prompt tokens. */
    priceInUsdPerMTok: number
    /** USD charged per million completion tokens. */
    priceOutUsdPerMTok: number
    /** Total context window in tokens; absent when not yet recorded. */
    contextWindowTokens?: number | null
}
