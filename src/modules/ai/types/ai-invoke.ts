import type {
    BaseMessage,
} from "@langchain/core/messages"
import type {
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
    ModelProvider,
} from "@modules/databases"
import type {
    AiJobSelection,
} from "./ai-job-selection"

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
     * Task this run serves (chatting / grading). When set, the Auto lane only
     * considers models whose `supportedTasks` include it, and orders the chain
     * health/latency-aware for it. Omit to consider every enabled model.
     */
    task?: AiModelTask
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
    /** Prompt (input) tokens the provider reported (0 when unreported). */
    promptTokens?: number
    /** Completion (output) tokens the provider reported (0 when unreported). */
    completionTokens?: number
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
     * Task this stream serves (chatting / grading). When set, the Auto lane only
     * considers models whose `supportedTasks` include it, ordered health/latency-aware.
     */
    task?: AiModelTask
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

/**
 * Params for {@link AiInvokeService.run} — the ONE high-level entry every AI
 * surface uses (grading, capstone, eval, interview, chatbot, future services).
 * Resolves the System routing (floor → tier ceiling → `ceil` cap → climb),
 * invokes (or streams when `onChunk` is set), and returns the served model + cost.
 */
export interface AiRunParams {
    /** The acting user (drives entitlement, tier ceiling, BYOK lookup). */
    userId: string
    /** Chat messages (system + human) to send to the model. */
    messages: Array<BaseMessage>
    /** The user's lane/model pick (System Auto vs Manual). Absent → Auto. */
    selection?: AiJobSelection
    /** Task difficulty → floor category (easy→economy … insane→frontier). */
    difficulty?: string | null
    /** Explicit floor override (wins over difficulty; chatbot passes Free). */
    floor?: AiModelCategory | null
    /** User-set per-feature ceiling cap (settings config per hạng mục). */
    ceil?: AiModelCategory | null
    /**
     * Task override (chatting / grading). Usually derived from {@link surface};
     * set explicitly only when there is no surface. Drives the Auto-lane
     * task-filter + health/latency-aware ordering.
     */
    task?: AiModelTask
    /**
     * Surface this run belongs to (chatbot/grading/interview). When set (and no
     * explicit `ceil`), `run()` resolves the user's saved per-surface ceiling
     * from settings and caps the climb at it. Omit for an uncapped run.
     */
    surface?: AiCeilSurface
    /** `false` for premium-only content (gated on a paid entitlement). */
    allowFreeAuto?: boolean
    /** Sampling temperature (default 0). */
    temperature?: number
    /** When set, the response is STREAMED and this fires per token delta. */
    onChunk?: AiStreamOnChunk
    /** Optional abort signal for the streaming path. */
    signal?: AbortSignal
}

/** Result of {@link AiInvokeService.run}. */
export interface AiRunResult {
    /** The model response content. */
    text: string
    /** The model that finally served (after any climb/fallback). */
    model: string
    /** The provider matching {@link AiRunResult.model}. */
    provider: ModelProvider
    /** Number of (model, key) attempts before success. */
    attempts: number
    /** Credits to charge for this run (served model's catalog credit; 0 for free/BYOK). */
    cost: number
    /** Prompt tokens (streaming path only). */
    promptTokens?: number
    /** Completion tokens (streaming path only). */
    completionTokens?: number
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
