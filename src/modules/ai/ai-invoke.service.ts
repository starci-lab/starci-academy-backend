import {
    Injectable,
} from "@nestjs/common"
import {
    ChatOpenAI,
} from "@langchain/openai"
import {
    ChatGoogleGenerativeAI,
} from "@langchain/google-genai"
import {
    ChatAnthropic,
} from "@langchain/anthropic"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    AiInvokeTimeoutException,
} from "@modules/platform/exceptions/errors/ai/ai-invoke-timeout"
import {
    AiStreamTimeoutException,
} from "@modules/platform/exceptions/errors/ai/ai-stream-timeout"
import {
    UnsupportedAiProviderException,
} from "@modules/platform/exceptions/errors/ai/unsupported-ai-provider"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    AiModelCatalogService,
} from "./balancer/ai-model-catalog.service"
import {
    UseApiService,
} from "./balancer/use-api.service"
import type {
    UseApiActionContext,
} from "./balancer/types/use-api"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import {
    DEFAULT_MODEL_CREDIT,
} from "./constants/credit-cost"
import {
    openRouterCacheHeaders,
} from "./utils/openrouter-cache-headers"
import {
    resolveGradingInvokeOptions,
} from "./utils/resolve-grading-invoke-options"
import {
    extractMessageText,
} from "./utils/extract-message-text"
import type {
    AiInvokeParams,
    AiInvokeResult,
    AiRunParams,
    AiRunResult,
    AiStreamChunk,
    AiStreamParams,
    AiStreamResult,
    BuildClientParams,
    ClassifyStreamFailureParams,
    StreamActionResult,
    StreamChunkTotals,
} from "./types/ai-invoke"


/**
 * Map the run surface to the model task it serves, so the Auto lane can filter
 * the catalog by `supportedTasks` + order the chain health/latency-aware.
 * Chatbot -> chatting; grading + interview -> grading; unknown -> undefined (no filter).
 */
const surfaceToTask = (surface?: AiCeilSurface): AiModelTask | undefined => {
    switch (surface) {
    case AiCeilSurface.Chatbot:
        return AiModelTask.Chatting
    case AiCeilSurface.Grading:
    case AiCeilSurface.Interview:
        return AiModelTask.Grading
    default:
        return undefined
    }
}

@Injectable()
/**
 * Single entry point for "just run this prompt against a working LLM".
 *
 * Hides key rotation + model fallback behind {@link UseApiService}: callers
 * hand over messages, the balancer picks a key/model, builds the LangChain
 * chat client, invokes, and rotates on failure. Use this from job processors
 * for every chat completion so each AI call benefits from the shared,
 * health-checked key pool.
 */
export class AiInvokeService {
    constructor(
        private readonly useApiService: UseApiService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly aiModelCatalogService: AiModelCatalogService,
    ) { }

    /**
     * Hard per-attempt timeout (ms) for one model call. A model that hasn't
     * finished within this window is aborted + surfaced as a TIMEOUT (classified
     * Transient) so the balancer climbs to the next model -- see `AI_INVOKE_TIMEOUT_MS`.
     */
    private readonly invokeTimeoutMs = envConfig().ai.invokeTimeoutMs

    /**
     * THE one high-level entry every AI surface uses (grading, capstone, eval,
     * interview, chatbot, and any future AI service). Resolves the System routing
     * from the inputs (the grading category, or an explicit `floor`, capped by
     * the user `ceil`), runs the model (invoke, or stream when
     * `onChunk` is set), and returns the served model + the credit `cost` to
     * charge. The caller does the `consume(cost)` (idempotency differs per surface).
     *
     * @param params - {@link AiRunParams}.
     * @returns {@link AiRunResult} -- text, served model/provider, and cost.
     */
    async run(
        {
            userId,
            messages,
            selection,
            floor,
            ceil,
            surface,
            task,
            allowFreeAuto,
            temperature,
            cacheSessionId,
            onChunk,
            signal,
        }: AiRunParams,
    ): Promise<AiRunResult> {
        // task drives the Auto-lane catalog filter + health/latency ordering;
        // explicit `task` wins, else derive it from the surface (chatbot/grading).
        const resolvedTask = task ?? surfaceToTask(surface)

        // explicit `ceil` wins; otherwise resolve the user's saved per-surface
        // ceiling from settings (cost control). Omitted surface -> uncapped.
        const effectiveCeil = ceil
            ?? (surface
                ? await this.aiEntitlementService.resolveCeil({
                    userId,
                    surface,
                })
                : null)

        // resolve the System routing (floor -> ceiling -> climb chain, or pinned model)
        const options = await resolveGradingInvokeOptions({
            userId,
            selection,
            floor,
            ceil: effectiveCeil,
            allowFreeAuto,
            aiEntitlementService: this.aiEntitlementService,
        })

        // cost = token-based credits for the served model. Billed by observed
        // input/output tokens x the model's per-Mtok rates; falls back to the
        // model's flat `credit` when usage is unreported (see creditForRun).
        const costFor = (
            model: string,
            promptTokens?: number,
            completionTokens?: number,
            cachedTokens?: number,
        ): Promise<number> =>
            this.aiModelCatalogService.creditForRun({
                name: model,
                promptTokens,
                completionTokens,
                cachedTokens,
                fallback: DEFAULT_MODEL_CREDIT,
            })

        // stream when a chunk callback is supplied; otherwise a one-shot invoke
        if (onChunk) {
            const result = await this.stream({
                messages,
                ...options,
                task: resolvedTask,
                temperature,
                cacheSessionId,
                onChunk,
                signal,
            })
            return {
                text: result.text,
                model: result.model,
                provider: result.provider,
                attempts: result.attempts,
                cost: await costFor(
                    result.model,
                    result.promptTokens,
                    result.completionTokens,
                    result.cachedTokens,
                ),
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
                cachedTokens: result.cachedTokens,
            }
        }

        const result = await this.invoke({
            messages,
            ...options,
            task: resolvedTask,
            temperature,
            cacheSessionId,
        })
        return {
            text: result.text,
            model: result.model,
            provider: result.provider,
            attempts: result.attempts,
            cost: await costFor(
                result.model,
                result.promptTokens,
                result.completionTokens,
                result.cachedTokens,
            ),
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            cachedTokens: result.cachedTokens,
        }
    }

    /**
     * Run the given messages against the highest-priority model + key pool,
     * falling back through every model on exhaustion.
     * @param params - The messages and optional category filter.
     * @returns The response text plus which model/provider finally served it.
     */
    async invoke(
        {
            messages,
            category,
            categories,
            temperature,
            model,
            provider,
            task,
            cacheSessionId,
        }: AiInvokeParams,
    ): Promise<AiInvokeResult> {
        // Default to deterministic sampling so the same submission grades the same.
        const resolvedTemperature = temperature ?? 0
        // single action used by every lane -- build the provider client and invoke once
        const invokeAction = async (
            context: UseApiActionContext,
        ): Promise<StreamActionResult> => {
            const chatModel = this.buildClient(
                {
                    provider: context.provider,
                    model: context.model,
                    apiKey: context.key,
                    temperature: resolvedTemperature,
                    cacheSessionId,
                },
            )
            // hard per-attempt timeout -> abort + surface as TIMEOUT (not AbortError)
            // so the balancer classifies it Transient and climbs to the next model
            const controller = new AbortController()
            let timedOut = false
            const timer = setTimeout(
                () => {
                    timedOut = true
                    controller.abort()
                },
                this.invokeTimeoutMs,
            )
            try {
                const response = await chatModel.invoke(
                    messages,
                    {
                        signal: controller.signal,
                    },
                )
                // capture token usage from the response so the caller can bill by
                // tokens (input + output) -- the provider reports it on invoke too,
                // not just on stream. Missing -> 0 (caller falls back to a flat cost).
                const usage = response.usage_metadata
                return {
                    text: extractMessageText(response.content),
                    promptTokens: usage?.input_tokens ?? 0,
                    completionTokens: usage?.output_tokens ?? 0,
                    // Prompt-cache hits are INCLUDED in `input_tokens`, but the
                    // provider charges a fraction for them (OpenRouter passes the
                    // discount straight through). Billing the learner the full
                    // input rate for tokens we got at a discount would break the
                    // rule that a credit represents what the call actually cost.
                    cachedTokens: usage?.input_token_details?.cache_read ?? 0,
                }
            } catch (error) {
                if (timedOut) {
                    throw new AiInvokeTimeoutException({
                        timeoutMs: this.invokeTimeoutMs,
                    })
                }
                throw error
            } finally {
                clearTimeout(timer)
            }
        }

        // Premium lane = a single pinned category (set by the entitlement resolver).
        // Auto lane = `categories` (the entitled tier set) -> balancer loops them
        // low->high by priority (Free -> Economy -> Balanced -> Premium, capped here).
        const isPremiumLane = category !== undefined
            && category !== AiModelCategory.Low

        const {
            result,
            model: usedModel,
            provider: usedProvider,
            attempts,
        } = isPremiumLane && category
            ? await this.useApiService.useApi<StreamActionResult>(
                {
                    lane: "pinned",
                    category,
                    model,
                    provider,
                    action: invokeAction,
                },
            )
            : await this.useApiService.useApi<StreamActionResult>(
                {
                    lane: "chain",
                    category,
                    categories,
                    model,
                    provider,
                    task,
                    action: invokeAction,
                },
            )
        return {
            text: result.text,
            model: usedModel,
            provider: usedProvider,
            attempts,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            cachedTokens: result.cachedTokens,
        }
    }

    /**
     * Stream the given messages against the resolved lane. Each provider
     * attempt is buffered until it completes, then only the winning attempt's
     * deltas are passed to `onChunk`.
     *
     * Mirrors {@link invoke} lane-for-lane (Premium / Auto) but builds a
     * streaming client and consumes `chatModel.stream(...)` instead of a single
     * `invoke`. Buffering is the production fallback policy: a provider that
     * fails after partial output must not leak that partial answer before the
     * balancer retries another provider. The accumulated text + observed token
     * usage are returned once the stream finishes; an aborted `signal` surfaces
     * as a thrown error without fallback.
     *
     * @param params - Messages, lane options, the chunk callback, and abort signal.
     * @returns The full text, the model/provider that served it, and token usage.
     */
    async stream(
        {
            messages,
            category,
            categories,
            temperature,
            model,
            provider,
            task,
            cacheSessionId,
            onChunk,
            signal,
        }: AiStreamParams,
    ): Promise<AiStreamResult> {
        // playground streams are generative -- default to a mild temperature unless pinned
        const resolvedTemperature = temperature ?? 0
        // single action used by every lane -- build the provider client and stream once
        const streamAction = async (
            context: UseApiActionContext,
        ): Promise<StreamActionResult> => {
            const chatModel = this.buildClient(
                {
                    provider: context.provider,
                    model: context.model,
                    apiKey: context.key,
                    temperature: resolvedTemperature,
                    cacheSessionId,
                },
            )
            // Buffer this attempt in full. Nothing reaches the caller until the
            // balancer has accepted this attempt as the winner; otherwise a
            // mid-stream failure followed by fallback would concatenate model A's
            // partial answer with model B's complete answer on the wire.
            const totals: StreamChunkTotals = {
                text: "",
                deltas: [],
                promptTokens: 0,
                completionTokens: 0,
                cachedTokens: 0,
            }
            // hard per-attempt timeout aborts the stream; combine it with the
            // caller's abort signal (user-stop). A TIMEOUT is surfaced as a plain
            // error -> Transient -> next model; a USER abort stays AbortError -> stop.
            const controller = new AbortController()
            let timedOut = false
            const abortFromCaller = () => controller.abort()
            const timer = setTimeout(
                () => {
                    timedOut = true
                    controller.abort()
                },
                this.invokeTimeoutMs,
            )
            this.linkCallerAbort(signal,
                controller,
                abortFromCaller)
            try {
                // `stream` yields AIMessageChunk objects; the combined signal cancels
                // the upstream HTTP request on user-abort OR timeout
                const stream = await chatModel.stream(
                    messages,
                    {
                        signal: controller.signal,
                    },
                )
                for await (const chunk of stream) {
                    this.foldStreamChunk(chunk,
                        totals)
                }
                return totals
            } catch (error) {
                throw this.classifyStreamFailure({
                    error,
                    timedOut,
                    signal,
                })
            } finally {
                clearTimeout(timer)
                signal?.removeEventListener("abort",
                    abortFromCaller)
            }
        }

        // Premium lane (any non-Economy category) pins one model; Auto runs the fallback chain
        const isPremiumLane = category !== undefined
            && category !== AiModelCategory.Low

        const {
            result,
            model: usedModel,
            provider: usedProvider,
            attempts,
        } = isPremiumLane && category
            ? await this.useApiService.useApi<StreamActionResult>(
                {
                    lane: "pinned",
                    category,
                    model,
                    provider,
                    action: streamAction,
                },
            )
            : await this.useApiService.useApi<StreamActionResult>(
                {
                    lane: "chain",
                    category,
                    categories,
                    model,
                    provider,
                    task,
                    action: streamAction,
                },
            )

        // A user abort is authoritative even if it races the provider's final
        // chunk. Check it after the winning attempt completes and before any
        // buffered text crosses the socket boundary, so abort means zero partial
        // output and therefore zero downstream charge/persistence.
        if (signal?.aborted) {
            const abortError = new Error("AI stream aborted by caller")
            abortError.name = "AbortError"
            throw abortError
        }
        for (const delta of result.deltas ?? [result.text]) {
            if (delta.length > 0) {
                onChunk(delta)
            }
        }
        return {
            text: result.text,
            model: usedModel,
            provider: usedProvider,
            attempts,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            cachedTokens: result.cachedTokens,
        }
    }

    /**
     * Wire the caller's abort signal into the per-attempt controller: abort
     * immediately if it is already aborted, otherwise forward a future abort.
     * @param signal - The caller's own abort signal, if any.
     * @param controller - The per-attempt controller driving the provider request.
     * @param onAbort - The listener to attach for a future abort.
     */
    private linkCallerAbort(
        signal: AbortSignal | undefined,
        controller: AbortController,
        onAbort: () => void,
    ): void {
        if (!signal) {
            return
        }
        if (signal.aborted) {
            controller.abort()
            return
        }
        signal.addEventListener(
            "abort",
            onAbort,
            {
                once: true,
            },
        )
    }

    /**
     * Fold one provider stream chunk into the attempt's running totals, mutating
     * `totals` in place so the caller's loop stays a single call per chunk.
     * @param chunk - The chunk yielded by the provider stream.
     * @param totals - The running totals for this attempt.
     */
    private foldStreamChunk(
        chunk: AiStreamChunk,
        totals: StreamChunkTotals,
    ): void {
        // chunk.content is a plain string for ordinary chat completions, but
        // some providers stream an array of content blocks -- extract the
        // text blocks instead of stringifying the whole array (S6551).
        const delta = extractMessageText(chunk.content)
        if (delta.length > 0) {
            // Preserve provider chunk boundaries for a post-success
            // flush, but do not expose this attempt yet.
            totals.text += delta
            totals.deltas.push(delta)
        }
        // some providers attach running usage on the final chunk(s) -- keep the
        // last reported counts so completion totals reflect the whole stream
        const usage = chunk.usage_metadata
        if (!usage) {
            return
        }
        totals.promptTokens = usage.input_tokens ?? totals.promptTokens
        totals.completionTokens = usage.output_tokens ?? totals.completionTokens
        // the chatbot resends its whole history every turn, so the cached share
        // of the prompt is exactly where the saving lives -- capture it or the
        // learner pays full price for tokens the provider discounted
        totals.cachedTokens = usage.input_token_details?.cache_read ?? totals.cachedTokens
    }

    /**
     * Decide which error a failed stream attempt should surface as: the hard
     * per-attempt timeout, a caller-initiated abort (normalized to `AbortError`
     * since provider SDKs do not consistently preserve it), or the original error.
     * @param params - The raw error plus the timeout/abort state at failure time.
     * @returns The error to throw from the attempt.
     */
    private classifyStreamFailure(
        {
            error,
            timedOut,
            signal,
        }: ClassifyStreamFailureParams,
    ): unknown {
        if (timedOut) {
            return new AiStreamTimeoutException({
                timeoutMs: this.invokeTimeoutMs,
            })
        }
        // Provider SDKs do not consistently preserve AbortError when their HTTP
        // request is cancelled. Normalize a caller-owned abort here so the
        // balancer always classifies it NonKey and stops instead of retrying
        // another key/model.
        if (signal?.aborted) {
            const abortError = new Error("AI stream aborted by caller")
            abortError.name = "AbortError"
            return abortError
        }
        return error
    }

    /**
     * Build the LangChain chat client for a resolved provider/model/key.
     *
     * Shared by the balancer-driven path (key picked by {@link UseApiService}).
     * @param params - The provider, model name, and raw API key.
     * @returns A provider-specific chat model wired with the given key.
     * @throws UnsupportedAiProviderException when the provider has no client.
     */
    private buildClient(
        {
            provider,
            model,
            apiKey,
            temperature,
            cacheSessionId,
        }: BuildClientParams,
    ): ChatOpenAI | ChatGoogleGenerativeAI | ChatAnthropic {
        // OpenRouter reuses a warm prompt-cache only when follow-up requests
        // route to the same upstream provider; its `x-session-id` header pins
        // that routing to a stable key. A header, never the body -- a bad value is
        // ignored, so the worst case is a cache miss, not a failed call.
        const openRouterHeaders = openRouterCacheHeaders(cacheSessionId)
        switch (provider) {
        case ModelProvider.OpenAI:
            return new ChatOpenAI(
                {
                    model,
                    apiKey,
                    temperature,
                },
            )
        case ModelProvider.Gemini:
            return new ChatGoogleGenerativeAI(
                {
                    model,
                    apiKey,
                    temperature,
                },
            )
        case ModelProvider.Local:
            // self-hosted OpenAI-compatible endpoint (Ollama / vLLM / LM Studio):
            // reuse ChatOpenAI but point it at the local baseURL. The key is a
            // placeholder the endpoint typically ignores.
            return new ChatOpenAI(
                {
                    model,
                    apiKey,
                    temperature,
                    configuration: {
                        baseURL: envConfig().ai.local.baseUrl,
                    },
                },
            )
        case ModelProvider.OpenRouter:
            // OpenRouter is an OpenAI-compatible aggregator gateway -- reuse
            // ChatOpenAI pointed at the OpenRouter baseURL with the pooled key.
            return new ChatOpenAI(
                {
                    model,
                    apiKey,
                    temperature,
                    configuration: {
                        baseURL: envConfig().ai.openrouter.baseUrl,
                        defaultHeaders: openRouterHeaders,
                    },
                },
            )
        case ModelProvider.Anthropic:
            // native Anthropic Claude API (e.g. claude-opus-4-8) -- used for the
            // frontier tier with the Anthropic key pool.
            return new ChatAnthropic(
                {
                    model,
                    apiKey,
                    temperature,
                },
            )
        default:
            throw new UnsupportedAiProviderException(
                {
                    provider: provider as string,
                },
            )
        }
    }
}
