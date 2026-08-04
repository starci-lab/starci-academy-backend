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
    AiModelCategory,
    AiModelTask,
    ModelProvider,
} from "@modules/databases"
import {
    AiInvokeTimeoutException,
    AiStreamTimeoutException,
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

/**
 * Map the run surface to the model task it serves, so the Auto lane can filter
 * the catalog by `supportedTasks` + order the chain health/latency-aware.
 * Chatbot → chatting; grading + interview → grading; unknown → undefined (no filter).
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
     * from the inputs (the grading category, or an explicit `floor`, capped by
     * the user `ceil`), runs the model (invoke, or stream when
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
            floor,
            ceil,
            surface,
            task,
            allowFreeAuto,
            temperature,
            onChunk,
            signal,
        }: AiRunParams,
    ): Promise<AiRunResult> {
        // task drives the Auto-lane catalog filter + health/latency ordering;
        // explicit `task` wins, else derive it from the surface (chatbot/grading).
        const resolvedTask = task ?? surfaceToTask(surface)

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
            floor,
            ceil: effectiveCeil,
            allowFreeAuto,
            aiEntitlementService: this.aiEntitlementService,
        })

        // cost = token-based credits for the served model. Billed by observed
        // input/output tokens × the model's per-Mtok rates; falls back to the
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
            }
        }

        const result = await this.invoke({
            messages,
            ...options,
            task: resolvedTask,
            temperature,
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
        }: AiInvokeParams,
    ): Promise<AiInvokeResult> {
        // Default to deterministic sampling so the same submission grades the same.
        const resolvedTemperature = temperature ?? 0
        // single action used by every lane — build the provider client and invoke once
        const invokeAction = async (
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
                // capture token usage from the response so the caller can bill by
                // tokens (input + output) — the provider reports it on invoke too,
                // not just on stream. Missing → 0 (caller falls back to a flat cost).
                const usage = response.usage_metadata
                return {
                    text: typeof response.content === "string"
                        ? response.content
                        : String(response.content),
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
        }
    }

    /**
     * Stream the given messages against the resolved lane, invoking `onChunk`
     * for every token delta as it arrives.
     *
     * Mirrors {@link invoke} lane-for-lane (Premium / Auto) but builds a
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
            temperature,
            model,
            provider,
            task,
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
            let cachedTokens = 0
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
                        // the chatbot resends its whole history every turn, so the
                        // cached share of the prompt is exactly where the saving
                        // lives — capture it or the learner pays full price for
                        // tokens the provider discounted
                        cachedTokens = usage.input_token_details?.cache_read
                            ?? cachedTokens
                    }
                }
                return {
                    text,
                    promptTokens,
                    completionTokens,
                    cachedTokens,
                }
            } catch (error) {
                if (timedOut) {
                    throw new AiStreamTimeoutException({
                        timeoutMs: this.invokeTimeoutMs,
                    })
                }
                throw error
            } finally {
                clearTimeout(timer)
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
