import type {
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

/**
 * OpenAI API key — distinct nominal type to prevent cross-provider misuse.
 */
export type OpenAiApiKey = Brand<string, "OpenAi">

/**
 * Google Gemini API key — distinct nominal type.
 */
export type GeminiApiKey = Brand<string, "Gemini">

/**
 * Anthropic Claude API key — distinct nominal type.
 */
export type ClaudeApiKey = Brand<string, "Claude">

/**
 * Compile-time map from a {@link ModelProvider} literal to its branded key type.
 *
 * Use it when writing helpers that need to return the right key shape for a
 * provider known at compile time:
 *
 * ```ts
 * const k: ApiKeyByProvider<ModelProvider.OpenAi> = "sk-..." as OpenAiApiKey
 * ```
 */
export type ApiKeyByProvider<P extends ModelProvider> =
    P extends ModelProvider.OpenAI ? OpenAiApiKey :
        P extends ModelProvider.Gemini ? GeminiApiKey :
            P extends ModelProvider.Claude ? ClaudeApiKey :
                never

/**
 * Action context delivered when the rotator picks an OpenAI key.
 */
export interface UseApiOpenAiContext {
    provider: ModelProvider.OpenAI
    /** Branded OpenAI key — feed into `new ChatOpenAI({ apiKey })`. */
    key: OpenAiApiKey
    /** Concrete model name from `app.yaml` (e.g. "gpt-4o-mini"). */
    model: string
}

/**
 * Action context delivered when the rotator picks a Gemini key.
 */
export interface UseApiGeminiContext {
    provider: ModelProvider.Gemini
    /** Branded Gemini key — feed into `new ChatGoogleGenerativeAI({ apiKey })`. */
    key: GeminiApiKey
    /** Concrete model name from `app.yaml` (e.g. "gemini-2.5-pro"). */
    model: string
}

/**
 * Action context delivered when the rotator picks a Claude key.
 */
export interface UseApiClaudeContext {
    provider: ModelProvider.Claude
    /** Branded Claude key — feed into `new ChatAnthropic({ apiKey })`. */
    key: ClaudeApiKey
    /** Concrete model name from `app.yaml` (e.g. "claude-sonnet-4-5"). */
    model: string
}

/**
 * Discriminated union over `provider` — narrowing on `ctx.provider` inside
 * the action callback gives type-safe access to the branded `key`:
 *
 * ```ts
 * switch (ctx.provider) {
 *   case ModelProvider.OpenAI:
 *     // ctx.key is OpenAiApiKey here
 *     return new ChatOpenAI({ apiKey: ctx.key, model: ctx.model }).invoke(prompt)
 *   case ModelProvider.Gemini:
 *     // ctx.key is GeminiApiKey here
 *     return new ChatGoogleGenerativeAI({ apiKey: ctx.key, model: ctx.model }).invoke(prompt)
 *   case ModelProvider.Claude:
 *     // ctx.key is ClaudeApiKey here
 *     return new ChatAnthropic({ apiKey: ctx.key, model: ctx.model }).invoke(prompt)
 * }
 * ```
 */
export type UseApiActionContext =
    | UseApiOpenAiContext
    | UseApiGeminiContext
    | UseApiClaudeContext

/**
 * Caller-supplied function executed against the picked key/model.
 *
 * Must throw on any failure that should trigger key rotation / model
 * fallback (HTTP 401, 429, 5xx, parse error, …). A returned value is
 * treated as success and ends the loop.
 */
export type UseApiAction<TResult> = (
    context: UseApiActionContext,
) => Promise<TResult>

/**
 * Params for `UseApiService.useApi`.
 */
export interface UseApiParams<TResult> {
    /** Worker callback — receives the picked key/model, returns the result. */
    action: UseApiAction<TResult>
    /**
     * Optional category filter — only models tagged with this category are
     * eligible for the fallback chain. Omit to allow every enabled model.
     */
    category?: AiModelCategory
}

/**
 * Result of `UseApiService.useApi`.
 */
export interface UseApiResult<TResult> {
    /** Whatever `action` returned. */
    result: TResult
    /** Concrete model that finally succeeded (after any fallbacks). */
    model: string
    /** Provider matching {@link model}. */
    provider: ModelProvider
    /** Number of `(model, key)` attempts the loop made before success. */
    attempts: number
}
