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
     * Auto-lane allowed categories (the user's entitled tiers). When set, the
     * Auto lane loops every enabled model whose category is in this set, by
     * priority (low→high: Free → Economy → Balanced → Premium), capped here by
     * entitlement. Takes precedence over {@link category} for the Auto lane.
     */
    categories?: Array<AiModelCategory>
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

/**
 * Callback invoked for every streamed token delta as
 * {@link AiInvokeService.stream} consumes the underlying model stream.
 *
 * @param delta - The incremental text produced since the previous chunk.
 */
export type AiStreamOnChunk = (delta: string) => void

/** Params for {@link AiInvokeService.stream}. */
export interface AiStreamParams {
    /** Chat messages (system + human) to send to the model. */
    messages: Array<BaseMessage>
    /** Optional category filter — restricts the fallback chain to one tier. */
    category?: AiModelCategory
    /**
     * Auto-lane allowed categories (the user's entitled tiers). When set, the
     * Auto lane loops every enabled model whose category is in this set, by
     * priority (low→high: Free → Economy → Balanced → Premium), capped here by
     * entitlement. Takes precedence over {@link category} for the Auto lane.
     */
    categories?: Array<AiModelCategory>
    /**
     * Optional bring-your-own-key descriptor. When provided, the shared key
     * pool / fallback chain is skipped and this exact key/model is used once.
     */
    byok?: AiInvokeByok
    /** User-pinned model (premium lane, or optional auto pin). */
    model?: string
    /** Provider for {@link AiStreamParams.model}. */
    provider?: ModelProvider
    /**
     * Sampling temperature. Defaults to 0 (deterministic); raise it only for
     * generative tasks (the playground) that want variety.
     */
    temperature?: number
    /** Called for every incremental token delta as the model streams. */
    onChunk: AiStreamOnChunk
    /**
     * Optional abort signal — when it fires the underlying model stream is
     * cancelled, surfacing as a thrown abort error the caller can handle.
     */
    signal?: AbortSignal
}

/**
 * Internal result of the streaming balancer action: the accumulated text plus
 * the token usage observed on the stream, returned through
 * {@link UseApiService.useApi} so the lane wrapper can attach model metadata.
 */
export interface StreamActionResult {
    /** The full concatenated response text. */
    text: string
    /** Prompt tokens reported by the model (0 when unreported). */
    promptTokens: number
    /** Completion tokens reported by the model (0 when unreported). */
    completionTokens: number
}

/** Result of {@link AiInvokeService.stream}. */
export interface AiStreamResult {
    /** The full concatenated response text produced by the stream. */
    text: string
    /** The model that served the request. */
    model: string
    /** The provider matching {@link AiStreamResult.model}. */
    provider: ModelProvider
    /** Number of (model, key) attempts before the stream started. */
    attempts: number
    /** Prompt tokens consumed (0 when the model did not report usage). */
    promptTokens: number
    /** Completion tokens produced (0 when the model did not report usage). */
    completionTokens: number
}
