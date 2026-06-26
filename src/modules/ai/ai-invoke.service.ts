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
    UseApiService,
} from "./balancer"
import type {
    UseApiActionContext,
} from "./balancer"
import type {
    AiInvokeParams,
    AiInvokeResult,
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
 * instead of `ModelService.get(...).invoke(...)` so every AI call benefits
 * from the shared key pool.
 */
@Injectable()
export class AiInvokeService {
    constructor(
        private readonly useApiService: UseApiService,
    ) { }

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
            const response = await chatModel.invoke(messages)
            return typeof response.content === "string"
                ? response.content
                : String(response.content)
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
            // `stream` yields AIMessageChunk objects; pass the abort signal so the
            // upstream HTTP request is cancelled when the learner aborts the run
            const stream = await chatModel.stream(
                messages,
                {
                    signal,
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
    ): ChatOpenAI | ChatGoogleGenerativeAI {
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
        default:
            throw new UnsupportedAiProviderException(
                {
                    provider: provider as string,
                },
            )
        }
    }
}
