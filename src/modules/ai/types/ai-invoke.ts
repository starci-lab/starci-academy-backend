import type {
    AIMessageChunk,
    BaseMessage,
} from "@langchain/core/messages"
import type {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import type {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import type {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import type {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import type {
    AiJobSelection,
} from "./ai-job-selection"

/** Params for {@link AiInvokeService.invoke}. */
export interface AiInvokeParams {
    /** Chat messages (system + human) to send to the model. */
    messages: Array<BaseMessage>
    /** Optional category filter -- restricts the fallback chain to one tier. */
    category?: AiModelCategory
    /**
     * Auto-lane allowed categories (the user's entitled tiers). When set, the
     * Auto lane loops every enabled model whose category is in this set, by
     * priority (low->high: Free -> Economy -> Balanced -> Premium), capped here by
     * entitlement. Takes precedence over {@link category} for the Auto lane.
     */
    categories?: Array<AiModelCategory>
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
     * Stable key grouping requests that share a prompt PREFIX onto the same
     * upstream provider, so its warm prompt-cache is reused (sent as OpenRouter's
     * `x-session-id`, <=256 chars). Grading passes the challenge/task id -- every
     * submission of one challenge repeats the same rubric system prompt, and
     * without this each submission's differing first user message hashes to a
     * different route and misses that shared cache. Chat passes the conversation
     * id. Omit when there is no reusable prefix.
     */
    cacheSessionId?: string
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
    /**
     * Prompt-cache HITS, already counted inside {@link promptTokens}. The
     * provider charges a fraction for these, so billing re-prices this share
     * rather than charging it at the full input rate.
     */
    cachedTokens?: number
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
    /** Optional category filter -- restricts the fallback chain to one tier. */
    category?: AiModelCategory
    /**
     * Auto-lane allowed categories (the user's entitled tiers). When set, the
     * Auto lane loops every enabled model whose category is in this set, by
     * priority (low->high: Free -> Economy -> Balanced -> Premium), capped here by
     * entitlement. Takes precedence over {@link category} for the Auto lane.
     */
    categories?: Array<AiModelCategory>
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
     * Stable key grouping same-prefix requests onto one provider for prompt-
     * cache reuse (OpenRouter `x-session-id`, <=256 chars). Grading -> challenge id;
     * chat -> conversation id. Omit when there is no reusable prefix.
     */
    cacheSessionId?: string
    /**
     * Sampling temperature. Defaults to 0 (deterministic); raise it only for
     * generative tasks (the playground) that want variety.
     */
    temperature?: number
    /** Called for every incremental token delta as the model streams. */
    onChunk: AiStreamOnChunk
    /**
     * Optional abort signal -- when it fires the underlying model stream is
     * cancelled, surfacing as a thrown abort error the caller can handle.
     */
    signal?: AbortSignal
}

/**
 * Running totals folded across a stream's chunks by
 * {@link AiInvokeService.foldStreamChunk} -- mutated in place so the caller's
 * loop stays a single call per chunk.
 */
export interface StreamChunkTotals {
    /** The full concatenated response text so far. */
    text: string
    /** Provider chunk boundaries captured so far. */
    deltas: Array<string>
    /** Prompt tokens reported by the model (0 when unreported). */
    promptTokens: number
    /** Completion tokens reported by the model (0 when unreported). */
    completionTokens: number
    /** Cached-read tokens reported by the model (0 when unreported). */
    cachedTokens: number
}

/** A single chunk from {@link AiInvokeService.stream}'s provider stream. */
export type AiStreamChunk = AIMessageChunk

/** Params to classify a failed stream attempt into the exception the caller should see. */
export interface ClassifyStreamFailureParams {
    /** The error the provider stream (or its abort) threw. */
    error: unknown
    /** Whether the per-attempt hard timeout fired before this error. */
    timedOut: boolean
    /** The caller's own abort signal, if any. */
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
    /**
     * Provider chunk boundaries captured for the successful attempt. They are
     * deliberately not emitted from inside the balancer action: an attempt may
     * fail after yielding text, and exposing that text would make a later
     * fallback concatenate two different model answers at the client.
     */
    deltas?: Array<string>
    /** Prompt tokens reported by the model (0 when unreported). */
    promptTokens: number
    /** Completion tokens reported by the model (0 when unreported). */
    completionTokens: number
    /**
     * Prompt-cache HITS, already counted inside `promptTokens`. Billed at a
     * fraction of the input rate, since the provider charges us a fraction.
     */
    cachedTokens?: number
}

/**
 * Params for {@link AiInvokeService.run} -- the ONE high-level entry every AI
 * surface uses (grading, capstone, eval, interview, chatbot, future services).
 * Resolves the System routing (floor -> tier ceiling -> `ceil` cap -> climb),
 * invokes (or streams when `onChunk` is set), and returns the served model + cost.
 */
export interface AiRunParams {
    /** The acting user (drives entitlement, tier ceiling). */
    userId: string
    /** Chat messages (system + human) to send to the model. */
    messages: Array<BaseMessage>
    /** The user's lane/model pick (System Auto vs Manual). Absent -> Auto. */
    selection?: AiJobSelection
    /**
     * Task difficulty, carried for logging/analytics only. It no longer selects
     * a model: every automatic grading run resolves to the same category, and
     * the frontier model is reachable only by pinning it explicitly.
     */
    difficulty?: string | null
    /** Explicit floor override (chatbot passes Free). */
    floor?: AiModelCategory | null
    /** User-set per-feature ceiling cap (settings config per surface). */
    ceil?: AiModelCategory | null
    /**
     * Task override (chatting / grading). Usually derived from {@link surface};
     * set explicitly only when there is no surface. Drives the Auto-lane
     * task-filter + health/latency-aware ordering.
     */
    task?: AiModelTask
    /**
     * Stable key grouping same-prefix requests onto one provider for prompt-
     * cache reuse (OpenRouter `x-session-id`, <=256 chars). Grading -> challenge id;
     * chat -> conversation id. Omit when there is no reusable prefix.
     */
    cacheSessionId?: string
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
    /** Credits to charge for this run (served model's catalog credit; 0 for free). */
    cost: number
    /** Prompt tokens (streaming path only). */
    promptTokens?: number
    /** Completion tokens (streaming path only). */
    completionTokens?: number
    /**
     * Prompt-cache HITS, already counted inside {@link promptTokens}. The
     * provider charges a fraction for these, so billing re-prices this share
     * rather than charging it at the full input rate.
     */
    cachedTokens?: number
}

/** Params for {@link AiInvokeService.buildClient}. */
export interface BuildClientParams {
    /** The resolved provider to build a client for. */
    provider: ModelProvider
    /** The provider-specific model name. */
    model: string
    /** The raw API key to authenticate the client with. */
    apiKey: string
    /** Sampling temperature to configure on the client. */
    temperature: number
    /** See {@link AiInvokeParams.cacheSessionId}. */
    cacheSessionId?: string
}

/** Result of {@link AiInvokeService.stream}. */
export interface AiStreamResult {
    /** The full concatenated response text produced by the stream. */
    text: string
    /** The model that served the request. */
    model: string
    /** The provider matching {@link AiStreamResult.model}. */
    provider: ModelProvider
    /** Number of (model, key) attempts before one stream completed successfully. */
    attempts: number
    /** Prompt tokens consumed (0 when the model did not report usage). */
    promptTokens: number
    /** Completion tokens produced (0 when the model did not report usage). */
    completionTokens: number
    /**
     * Prompt-cache HITS, already counted inside `promptTokens`. Billed at a
     * fraction of the input rate, since the provider charges us a fraction.
     */
    cachedTokens?: number
}
