import type {
    AiMode,
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"

/**
 * Internal symbol used to brand API-key string types — never exported, never
 * accessed at runtime. Two declarations of the same brand collapse to one
 * type identity.
 */
declare const apiKeyBrand: unique symbol

/**
 * Branded string type — a `string` at runtime, but the structural `__brand`
 * symbol prevents accidentally passing e.g. an OpenAI key where a Gemini key
 * is required.
 */
export type Brand<T, B extends string> = T & { readonly [apiKeyBrand]: B }

/** OpenAI API key — distinct nominal type to prevent cross-provider misuse. */
export type OpenAiApiKey = Brand<string, "OpenAi">

/** Google Gemini API key — distinct nominal type. */
export type GeminiApiKey = Brand<string, "Gemini">

/**
 * Action context delivered when the rotator picks an OpenAI key.
 */
export interface UseApiOpenAiContext {
    provider: ModelProvider.OpenAI
    /** Branded OpenAI key — feed into `new ChatOpenAI({ apiKey })`. */
    key: OpenAiApiKey
    /** Concrete model name from the catalog (e.g. "gpt-4o-mini"). */
    model: string
}

/**
 * Action context delivered when the rotator picks a Gemini key.
 */
export interface UseApiGeminiContext {
    provider: ModelProvider.Gemini
    /** Branded Gemini key — feed into `new ChatGoogleGenerativeAI({ apiKey })`. */
    key: GeminiApiKey
    /** Concrete model name from the catalog (e.g. "gemini-2.5-pro"). */
    model: string
}

/** Discriminated union over `provider` for pooled-key invocations. */
export type UseApiActionContext =
    | UseApiOpenAiContext
    | UseApiGeminiContext

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
 * Auto lane — full model fallback chain + round-robin keys + Redis cache
 * updates on failure. Retries until the configured max attempts.
 */
export interface UseApiAutoParams<TResult> {
    /** Discriminant: free Auto lane. */
    lane: AiMode.Auto
    /** Worker callback — receives the picked key/model, returns the result. */
    action: UseApiAction<TResult>
    /**
     * Optional category filter — only models tagged with this category are
     * eligible for the fallback chain. Omit to allow every enabled model.
     */
    category?: AiModelCategory
    /** When set with {@link provider}, only this catalog model is tried (auto pin). */
    model?: string
    /** Provider for {@link UseApiAutoParams.model}. */
    provider?: ModelProvider
}

/**
 * Premium lane — the single resolved model only (no model fallback). Keys still
 * rotate round-robin; each failure updates cache; throws when exhausted.
 */
export interface UseApiPremiumParams<TResult> {
    /** Discriminant: paid Premium lane. */
    lane: AiMode.Premium
    /** Worker callback — receives the picked key/model, returns the result. */
    action: UseApiAction<TResult>
    /** Paid-tier category the user is entitled to. */
    category: AiModelCategory
    /** User-selected model name — highest priority when set. */
    model?: string
    /** User-selected provider — required when {@link UseApiPremiumParams.model} is set. */
    provider?: ModelProvider
}

/**
 * BYOK lane — a single invoke with the user's own key (bypasses the pool).
 * Failures propagate immediately (no pooled cache update).
 */
export interface UseApiByokParams<TResult> {
    /** Discriminant: bring-your-own-key lane. */
    lane: AiMode.Byok
    /** Worker callback — receives the user's key/model, returns the result. */
    action: UseApiAction<TResult>
    /** BYOK provider. */
    provider: ModelProvider
    /** BYOK model name. */
    model: string
    /** User's raw API key. */
    key: string
}

/**
 * Discriminated lane params for {@link UseApiService.useApi}, keyed on the
 * {@link AiMode} `lane`. One entry point replaces the per-lane methods.
 */
export type UseApiParams<TResult> =
    | UseApiAutoParams<TResult>
    | UseApiPremiumParams<TResult>
    | UseApiByokParams<TResult>
