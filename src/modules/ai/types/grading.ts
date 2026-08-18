import type {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

/**
 * Caller input when enqueueing or persisting a grading model pick.
 */
export interface GradingLaneParams {
    /** Concrete model name (GraphQL `selectedModel` / job `gradingModel`); absent -> balancer picks. */
    model?: string
    /** Provider for {@link GradingLaneParams.model}. */
    provider?: ModelProvider
}

/**
 * Normalized model fields safe to persist on a row or BullMQ payload -- the
 * pinned model the validator resolved, or neither when nothing was pinned (the
 * balancer picks).
 */
export interface ValidatedGradingLane {
    /** Model for a pinned pooled invoke; absent -> balancer picks. */
    gradingModel?: string
    /** Provider for {@link ValidatedGradingLane.gradingModel}. */
    gradingProvider?: ModelProvider
}

/**
 * Actual model/provider used by {@link AiInvokeService.invoke} for one grading run.
 */
export interface GradingStepAiUsage {
    /** Model that served the request after balancer fallback. */
    model: string
    /** Provider matching {@link GradingStepAiUsage.model}. */
    provider: ModelProvider
    /** Number of (model, key) attempts before success. */
    attempts: number
    /** Input (prompt) tokens the model reported (0/undefined when unreported). */
    promptTokens?: number
    /** Output (completion) tokens the model reported (0/undefined when unreported). */
    completionTokens?: number
    /**
     * Prompt-cache hits, already counted inside {@link promptTokens}. Carried so
     * the post-commit billing can re-price them at the model's cache rate rather
     * than the full input rate -- see `creditForRun`.
     */
    cachedTokens?: number
}
