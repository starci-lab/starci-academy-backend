import type {
    AiMode,
    ModelProvider,
} from "@modules/databases"

/**
 * Caller input when enqueueing or persisting a grading lane pick.
 */
export interface GradingLaneRequest {
    /** AI lane (`auto` / `premium` / `byok`); defaults to `auto` when omitted. */
    mode?: AiMode
    /** Concrete model name (GraphQL `selectedModel` / job `gradingModel`). */
    model?: string
    /** Provider for {@link GradingLaneRequest.model}. */
    provider?: ModelProvider
    /** Optional one-shot BYOK key; otherwise the stored subscription key is used at grade time. */
    byokApiKey?: string
}

/**
 * Normalized lane + model fields safe to persist on a row or BullMQ payload.
 */
export interface ValidatedGradingLane {
    /** Resolved lane after entitlement check. */
    mode: AiMode
    /** Model for pooled invoke (premium, or optional auto pin). */
    gradingModel?: string
    /** Provider for {@link ValidatedGradingLane.gradingModel}. */
    gradingProvider?: ModelProvider
    /** BYOK provider (required when {@link ValidatedGradingLane.mode} is `byok`). */
    byokProvider?: ModelProvider
    /** BYOK model (required when mode is `byok`). */
    byokModel?: string
    /**
     * Plaintext BYOK key when supplied inline on the request.
     * Omitted when the worker should load the encrypted key from the DB.
     */
    byokApiKey?: string
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
}
