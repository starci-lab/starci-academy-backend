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
    AiMode,
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import {
    UnsupportedAiProviderException,
} from "@modules/exceptions"
import {
    envConfig,
} from "@modules/env"
import {
    AiModelCatalogService,
    UseApiService,
} from "./balancer"
import type {
    UseApiActionContext,
} from "./balancer"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import {
    DEFAULT_MODEL_CREDIT,
} from "./constants"
import {
    resolveGradingInvokeOptions,
} from "./utils"
import type {
    AiInvokeParams,
    AiInvokeResult,
    AiRunParams,
    AiRunResult,
    AiStreamParams,
    AiStreamResult,
} from "./types"
import type {
    StreamActionResult,
} from "./types"


/**
 * Single entry point for "just run this prompt against a working LLM".
 *
 * Hides key rotation + model fallback behind {@link UseApiService}: callers
 * hand over messages, the balancer picks a key/model, builds the LangChain
 * chat client, invokes, and rotates on failure. Use this from job processors
 * for every chat completion so each AI call benefits from the shared,
 * health-checked key pool.
 */
@Injectable()
export class AiInvokeService {
    constructor(
        private readonly useApiService: UseApiService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly aiModelCatalogService: AiModelCatalogService,
    ) { }

    /**
     * Hard per-attempt timeout (ms) for one model call. A model that hasn't
     * finished within this window is aborted + surfaced as a TIMEOUT (classified
     * Transient) so the balancer climbs to the next model — see `AI_INVOKE_TIMEOUT_MS`.
     */
    private readonly invokeTimeoutMs = envConfig().ai.invokeTimeoutMs

    /**
     * THE one high-level entry every AI surface uses (grading, capstone, eval,
     * interview, chatbot, and any future AI service). Resolves the System routing
     * from the inputs (floor by `difficulty`/`floor`, climbing up to the plan
     * ceiling capped by the user `ceil`), runs the model (invoke, or stream when
     * `onChunk` is set), and returns the served model + the credit `cost` to
     * charge. The caller does the `consume(cost)` (idempotency differs per surface).
     *
     * @param params - {@link AiRunParams}.
     * @returns {@link AiRunResult} — text, served model/provider, and cost.
     */
    async run(
        {
            userId,
            messages,
            selection,
            difficulty,
            floor,
            ceil,
            surface,
            allowFreeAuto,
            temperature,
            onChunk,
            signal,
        }: AiRunParams,
    ): Promise<AiRunResult> {
        // explicit `ceil` wins; otherwise resolve the user's saved per-surface
        // ceiling from settings (cost control). Omitted surface → uncapped.
        const effectiveCeil = ceil
            ?? (surface
                ? await this.aiEntitlementService.resolveCeil({
                    userId,
                    surface,
                })
                : null)

        // resolve the System routing (floor → ceiling → climb chain, or pinned model)
        const options = await resolveGradingInvokeOptions({
            userId,
            selection,
            difficulty,
            floor,
            ceil: effectiveCeil,
            allowFreeAuto,
            aiEntitlementService: this.aiEntitlementService,
        })

        // cost = served model's catalog credit (0 for free models / dormant BYOK)
        const costFor = (model: string): Promise<number> =>
            options.byok
                ? Promise.resolve(0)
                : this.aiModelCatalogService.creditForModel({
                    name: model,
                    fallback: DEFAULT_MODEL_CREDIT,
                })

        // stream when a chunk callback is supplied; otherwise a one-shot invoke
        if (onChunk) {
            const result = await this.stream({
                messages,
                ...options,
                temperature,
                onChunk,
                signal,
            })
            return {
                text: result.text,
                model: result.model,
                provider: result.provider,
                attempts: result.attempts,
                cost: await costFor(result.model),
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
            }
        }

        const result = await this.invoke({
            messages,
            ...options,
            temperature,
        })
        return {
            text: result.text,
            model: result.model,
            provider: result.provider,
            attempts: result.attempts,
            cost: await costFor(result.model),
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
            byok,
            temperature,
            model,
            provider,
        }: AiInvokeParams,
    ): Promise<AiInvokeResult> {
        // Default to deterministic sampling so the same submission grades the same.
        const resolvedTemperature = temperature ?? 0
        // single action used by every lane — build the provider client and invoke once
        const invokeAction = async (context: UseApiActionContext) => {
            const chatModel = this.buildClient(
                {
                    provider: context.provider,
                    model: context.model,
                    apiKey: context.key,
                    temperature: resolvedTemperature,
                },
            )
            // hard per-attempt timeout → abort + surface as TIMEOUT (not AbortError)
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
                return typeof response.content === "string"
                    ? response.content
                    : String(response.content)
            } catch (error) {
                if (timedOut) {
                    throw new Error(
                        `AI invoke timed out after ${this.invokeTimeoutMs}ms`,
                    )
                }
                throw error
            } finally {
                clearTimeout(timer)
            }
        }

        // BYOK → user's own key, bypassing the shared pool / fallback chain
        if (byok) {
            const {
                result,
                model: usedModel,
                provider: usedProvider,
                attempts,
            } = await this.useApiService.useApi<string>(
                {
                    lane: AiMode.Byok,
                    provider: byok.provider,
                    model: byok.model,
                    key: byok.key,
                    action: invokeAction,
                },
            )
            return {
                text: result,
                model: usedModel,
                provider: usedProvider,
                attempts,
            }
        }

        // Premium lane = a single pinned category (set by the entitlement resolver).
        // Auto lane = `categories` (the entitled tier set) → balancer loops them
        // low→high by priority (Free → Economy → Balanced → Premium, capped here).
        const isPremiumLane = category !== undefined
            && category !== AiModelCategory.Economy

        const {
            result,
            model: usedModel,
            provider: usedProvider,
            attempts,
        } = isPremiumLane && category
            ? await this.useApiService.useApi<string>(
                {
                    lane: AiMode.Premium,
                    category,
                    model,
                    provider,
                    action: invokeAction,
                },
            )
            : await this.useApiService.useApi<string>(
                {
                    lane: AiMode.Auto,
                    category,
                    categories,
                    model,
                    provider,
                    action: invokeAction,
                },
            )
        return {
            text: result,
            model: usedModel,
            provider: usedProvider,
            attempts,
        }
    }

    /**
     * Stream the given messages against the resolved lane, invoking `onChunk`
     * for every token delta as it arrives.
     *
     * Mirrors {@link invoke} lane-for-lane (BYOK / Premium / Auto) but builds a
     * streaming client and consumes `chatModel.stream(...)` instead of a single
     * `invoke`. The accumulated text + observed token usage are returned once
     * the stream finishes; an aborted `signal` surfaces as a thrown error.
     *
     * @param params - Messages, lane options, the chunk callback, and abort signal.
     * @returns The full text, the model/provider that served it, and token usage.
     */
    async stream(
        {
            messages,
            category,
            categories,
            byok,
            temperature,
            model,
            provider,
            onChunk,
            signal,
        }: AiStreamParams,
    ): Promise<AiStreamResult> {
        // playground streams are generative — default to a mild temperature unless pinned
        const resolvedTemperature = temperature ?? 0
        // single action used by every lane — build the provider client and stream once
        const streamAction = async (
            context: UseApiActionContext,
        ): Promise<StreamActionResult> => {
            const chatModel = this.buildClient(
                {
                    provider: context.provider,
                    model: context.model,
                    apiKey: context.key,
                    temperature: resolvedTemperature,
                },
            )
            // accumulate the full text + token usage across every streamed chunk
            let text = ""
            let promptTokens = 0
            let completionTokens = 0
            // hard per-attempt timeout aborts the stream; combine it with the
            // caller's abort signal (user-stop). A TIMEOUT is surfaced as a plain
            // error → Transient → next model; a USER abort stays AbortError → stop.
            const controller = new AbortController()
            let timedOut = false
            const timer = setTimeout(
                () => {
                    timedOut = true
                    controller.abort()
                },
                this.invokeTimeoutMs,
            )
            if (signal) {
                if (signal.aborted) {
                    controller.abort()
                } else {
                    signal.addEventListener(
                        "abort",
                        () => controller.abort(),
                        {
                            once: true,
                        },
                    )
                }
            }
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
                    // chunk.content is string for chat models; coerce defensively
                    const delta = typeof chunk.content === "string"
                        ? chunk.content
                        : String(chunk.content)
                    if (delta.length > 0) {
                        // grow the accumulated answer and notify the caller of the delta
                        text += delta
                        onChunk(delta)
                    }
                    // some providers attach running usage on the final chunk(s) — keep the
                    // last reported counts so completion totals reflect the whole stream
                    const usage = chunk.usage_metadata
                    if (usage) {
                        promptTokens = usage.input_tokens ?? promptTokens
                        completionTokens = usage.output_tokens ?? completionTokens
                    }
                }
                return {
                    text,
                    promptTokens,
                    completionTokens,
                }
            } catch (error) {
                if (timedOut) {
                    throw new Error(
                        `AI stream timed out after ${this.invokeTimeoutMs}ms`,
                    )
                }
                throw error
            } finally {
                clearTimeout(timer)
            }
        }

        // BYOK → user's own key, bypassing the shared pool / fallback chain
        if (byok) {
            const {
                result,
                model: usedModel,
                provider: usedProvider,
                attempts,
            } = await this.useApiService.useApi<StreamActionResult>(
                {
                    lane: AiMode.Byok,
                    provider: byok.provider,
                    model: byok.model,
                    key: byok.key,
                    action: streamAction,
                },
            )
            return {
                text: result.text,
                model: usedModel,
                provider: usedProvider,
                attempts,
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
            }
        }

        // Premium lane (any non-Economy category) pins one model; Auto runs the fallback chain
        const isPremiumLane = category !== undefined
            && category !== AiModelCategory.Economy

        const {
            result,
            model: usedModel,
            provider: usedProvider,
            attempts,
        } = isPremiumLane && category
            ? await this.useApiService.useApi<StreamActionResult>(
                {
                    lane: AiMode.Premium,
                    category,
                    model,
                    provider,
                    action: streamAction,
                },
            )
            : await this.useApiService.useApi<StreamActionResult>(
                {
                    lane: AiMode.Auto,
                    category,
                    categories,
                    model,
                    provider,
                    action: streamAction,
                },
            )
        return {
            text: result.text,
            model: usedModel,
            provider: usedProvider,
            attempts,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
        }
    }

    /**
     * Build the LangChain chat client for a resolved provider/model/key.
     *
     * Shared by both the balancer-driven path (key picked by
     * {@link UseApiService}) and the BYOK path (key supplied by the caller).
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
        }: {
            provider: ModelProvider
            model: string
            apiKey: string
            temperature: number
        },
    ): ChatOpenAI | ChatGoogleGenerativeAI | ChatAnthropic {
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
            // OpenRouter is an OpenAI-compatible aggregator gateway — reuse
            // ChatOpenAI pointed at the OpenRouter baseURL with the pooled key.
            return new ChatOpenAI(
                {
                    model,
                    apiKey,
                    temperature,
                    configuration: {
                        baseURL: envConfig().ai.openrouter.baseUrl,
                    },
                },
            )
        case ModelProvider.Anthropic:
            // native Anthropic Claude API (e.g. claude-opus-4-8) — used for the
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
