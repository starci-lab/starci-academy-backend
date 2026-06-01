import type {
    BaseMessage,
} from "@langchain/core/messages"
import type {
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"

/**
 * Bring-your-own-key descriptor — when present on {@link AiInvokeParams} the
 * balancer is bypassed entirely and this exact `{provider, model, key}` is used.
 */
export interface AiInvokeByok {
    /** Provider whose SDK client to build (OpenAI/Gemini only). */
    provider: ModelProvider
    /** Concrete model name to invoke. */
    model: string
    /** The user's own raw API key. */
    key: string
}

/** Params for {@link AiInvokeService.invoke}. */
export interface AiInvokeParams {
    /** Chat messages (system + human) to send to the model. */
    messages: Array<BaseMessage>
    /** Optional category filter — restricts the fallback chain to one tier. */
    category?: AiModelCategory
    /**
     * Optional bring-your-own-key descriptor. When provided, the shared key
     * pool / fallback chain is skipped and this exact key/model is used once.
     */
    byok?: AiInvokeByok
    /** User-pinned model (premium lane, or optional auto pin). */
    model?: string
    /** Provider for {@link AiInvokeParams.model}. */
    provider?: ModelProvider
    /**
     * Sampling temperature. Defaults to 0 (deterministic) so grading is
     * reproducible; raise it only for generative tasks that want variety.
     */
    temperature?: number
}

/** Result of {@link AiInvokeService.invoke}. */
export interface AiInvokeResult {
    /** The model response content as a string. */
    text: string
    /** The model that finally served the request (after any fallback). */
    model: string
    /** The provider matching {@link AiInvokeResult.model}. */
    provider: ModelProvider
    /** Number of (model, key) attempts before success. */
    attempts: number
}
