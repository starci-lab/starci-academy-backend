import type {
    AiModelCategory,
    AiModelTask,
    ModelProvider,
} from "@modules/databases"

/**
 * Internal symbol used to brand API-key string types -- never exported, never
 * accessed at runtime. Two declarations of the same brand collapse to one
 * type identity.
 */
declare const apiKeyBrand: unique symbol

/**
 * Branded string type -- a `string` at runtime, but the structural `__brand`
 * symbol prevents accidentally passing e.g. an OpenAI key where a Gemini key
 * is required.
 */
export type Brand<T, B extends string> = T & { readonly [apiKeyBrand]: B }

/** OpenAI API key -- distinct nominal type to prevent cross-provider misuse. */
export type OpenAiApiKey = Brand<string, "OpenAi">

/** Google Gemini API key -- distinct nominal type. */
export type GeminiApiKey = Brand<string, "Gemini">

/**
 * Local (self-hosted, OpenAI-compatible) API key -- distinct nominal type. The
 * value is a placeholder (e.g. "ollama"); the endpoint usually ignores it.
 */
export type LocalApiKey = Brand<string, "Local">

/**
 * OpenRouter API key (Bearer) -- distinct nominal type. Feed into `ChatOpenAI`
 * pointed at the OpenRouter `baseURL` (OpenAI-compatible aggregator gateway).
 */
export type OpenRouterApiKey = Brand<string, "OpenRouter">

/** Anthropic API key -- distinct nominal type. Feed into `new ChatAnthropic({ apiKey })`. */
export type AnthropicApiKey = Brand<string, "Anthropic">

/**
 * Action context delivered when the rotator picks an OpenAI key.
 */
export interface UseApiOpenAiContext {
    provider: ModelProvider.OpenAI
    /** Branded OpenAI key -- feed into `new ChatOpenAI({ apiKey })`. */
    key: OpenAiApiKey
    /** Concrete model name from the catalog (e.g. "gpt-4o-mini"). */
    model: string
}

/**
 * Action context delivered when the rotator picks a Gemini key.
 */
export interface UseApiGeminiContext {
    provider: ModelProvider.Gemini
    /** Branded Gemini key -- feed into `new ChatGoogleGenerativeAI({ apiKey })`. */
    key: GeminiApiKey
    /** Concrete model name from the catalog (e.g. "gemini-2.5-pro"). */
    model: string
}

/**
 * Action context delivered when the rotator picks a Local (self-hosted) key.
 */
export interface UseApiLocalContext {
    provider: ModelProvider.Local
    /** Placeholder key -- feed into `new ChatOpenAI({ apiKey, configuration:{ baseURL } })`. */
    key: LocalApiKey
    /** Concrete local model name (e.g. "qwen2.5-coder:7b"). */
    model: string
}

/**
 * Action context delivered when the rotator picks an OpenRouter key.
 */
export interface UseApiOpenRouterContext {
    provider: ModelProvider.OpenRouter
    /** Branded OpenRouter key -- feed into `ChatOpenAI` with the OpenRouter `baseURL`. */
    key: OpenRouterApiKey
    /** Concrete model name from the catalog (e.g. "qwen/qwen-2.5-coder-32b-instruct"). */
    model: string
}

/**
 * Action context delivered when the rotator picks an Anthropic key.
 */
export interface UseApiAnthropicContext {
    provider: ModelProvider.Anthropic
    /** Branded Anthropic key -- feed into `new ChatAnthropic({ apiKey })`. */
    key: AnthropicApiKey
    /** Concrete model name from the catalog (e.g. "claude-opus-4-8"). */
    model: string
}

/** Discriminated union over `provider` for pooled-key invocations. */
export type UseApiActionContext =
    | UseApiOpenAiContext
    | UseApiGeminiContext
    | UseApiLocalContext
    | UseApiOpenRouterContext
    | UseApiAnthropicContext

/**
 * Caller-supplied function executed against the picked key/model.
 * Must throw on failure that should trigger rotation / retry.
 */
export type UseApiAction<TResult> = (
    context: UseApiActionContext,
) => Promise<TResult>

/** Shared result shape for all `UseApiService` entry points. */
export interface UseApiResult<TResult> {
    /** Whatever `action` returned. */
    result: TResult
    /** Concrete model that served the request. */
    model: string
    /** Provider matching {@link model}. */
    provider: ModelProvider
    /** Number of `(model, key)` attempts before success. */
    attempts: number
}

/**
 * Chain lane -- full model fallback chain + round-robin keys + Redis cache
 * updates on failure. Retries until the configured max attempts. Used when no
 * concrete model is pinned (the balancer climbs the entitled category chain).
 */
export interface UseApiAutoParams<TResult> {
    /** Discriminant: climb the balancer category chain (no pinned model). */
    lane: "chain"
    /** Worker callback -- receives the picked key/model, returns the result. */
    action: UseApiAction<TResult>
    /**
     * Optional single-category filter -- only models tagged with this category are
     * eligible for the fallback chain. Omit to allow every enabled model.
     */
    category?: AiModelCategory
    /**
     * Optional multi-category filter (the user's entitled tiers). When set, the
     * chain includes every enabled model whose category is in this set, looped
     * by priority (low->high). Takes precedence over {@link category}. This is how
     * the Auto lane climbs Free -> Economy -> Balanced -> Premium within entitlement.
     */
    categories?: Array<AiModelCategory>
    /** When set with {@link provider}, only this catalog model is tried (auto pin). */
    model?: string
    /** Provider for {@link UseApiAutoParams.model}. */
    provider?: ModelProvider
    /**
     * Task this run serves (chatting / grading). When set, the chain only
     * includes models whose `supportedTasks` include it, and is ordered
     * health/latency-aware (down models deprioritized; chat -> fastest first).
     */
    task?: AiModelTask
}

/**
 * Pinned lane -- the single resolved model only (no model fallback). Keys still
 * rotate round-robin; each failure updates cache; throws when exhausted. Used
 * when a concrete model (category, or user pin) is resolved.
 */
export interface UseApiPremiumParams<TResult> {
    /** Discriminant: pin one resolved model (no chain climb). */
    lane: "pinned"
    /** Worker callback -- receives the picked key/model, returns the result. */
    action: UseApiAction<TResult>
    /** Paid-tier category the user is entitled to. */
    category: AiModelCategory
    /** User-selected model name -- highest priority when set. */
    model?: string
    /** User-selected provider -- required when {@link UseApiPremiumParams.model} is set. */
    provider?: ModelProvider
}

/**
 * Discriminated lane params for {@link UseApiService.useApi}, keyed on the
 * `lane` literal (`"chain"` = balancer climb - `"pinned"` = single model). One
 * entry point replaces the per-lane methods.
 */
export type UseApiParams<TResult> =
    | UseApiAutoParams<TResult>
    | UseApiPremiumParams<TResult>

/**
 * Params for {@link UseApiService.probeModel} -- probe ONE specific model with a
 * minimal 1-token completion to measure latency + up/down. Distinct from
 * {@link useApi}: no model fallback chain (we want this exact model), no ping-cache
 * mutation (status/UI only, does not affect balancer eligibility).
 */
export interface ProbeModelParams {
    /** Provider that serves {@link model}. */
    provider: ModelProvider
    /** Concrete model name to probe (e.g. "qwen2.5-coder:7b"). */
    model: string
    /** Hard timeout (ms) for the probe -- aborts + records down past this. */
    timeoutMs: number
}

/**
 * Result of {@link UseApiService.probeModel} -- the outcome of one latency probe.
 */
export interface ProbeModelResult {
    /** Whether the 1-token completion succeeded within the timeout. */
    ok: boolean
    /** Round-trip latency in ms (0 when the probe failed before timing). */
    latencyMs: number
    /** Short failure reason when {@link ok} is false, else null. */
    errorMessage: string | null
}

/** Params for {@link UseApiService.invokeWithCache}. */
export interface InvokeWithCacheParams<TResult> {
    /** Provider the picked key belongs to. */
    provider: ModelProvider
    /** The picked API key. */
    key: string
    /** Concrete model name being invoked. */
    model: string
    /** Worker callback -- receives the picked key/model, returns the result. */
    action: UseApiAction<TResult>
}

/** Params for {@link UseApiService.buildProbeRequest}. */
export interface BuildProbeRequestParams {
    /** Provider that serves {@link model}. */
    provider: ModelProvider
    /** Concrete model name to build the probe request for. */
    model: string
    /** API key to authenticate the probe request with. */
    apiKey: string
}
