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
    UseApiService,
} from "./balancer"
import type {
    UseApiActionContext,
} from "./balancer"
import type {
    AiInvokeParams,
    AiInvokeResult,
} from "./types"

/** OpenAI-compatible base URL for the OpenRouter gateway (free models like DeepSeek). */
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

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

        // Premium lane (any non-Economy category) pins one model; Auto runs the fallback chain
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
        case ModelProvider.OpenRouter:
            // OpenRouter is OpenAI-compatible — reuse ChatOpenAI but point it at the
            // OpenRouter gateway so free models (e.g. DeepSeek) resolve through one key.
            return new ChatOpenAI(
                {
                    model,
                    apiKey,
                    temperature,
                    configuration: {
                        baseURL: OPENROUTER_BASE_URL,
                    },
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
        default:
            throw new UnsupportedAiProviderException(
                {
                    provider: provider as string,
                },
            )
        }
    }
}
