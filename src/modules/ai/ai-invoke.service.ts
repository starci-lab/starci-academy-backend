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
    ModelProvider,
} from "@modules/databases"
import {
    UnsupportedAiProviderException,
} from "@modules/exceptions"
import {
    UseApiService,
} from "./balancer"
import type {
    AiInvokeParams,
    AiInvokeResult,
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
            byok,
            temperature,
        }: AiInvokeParams,
    ): Promise<AiInvokeResult> {
        // Default to deterministic sampling so the same submission grades the same.
        const resolvedTemperature = temperature ?? 0
        /**
         * BYOK path — skip the shared key pool / fallback chain entirely and
         * invoke the user's own key/model exactly once.
         */
        if (byok) {
            const chatModel = this.buildClient(
                {
                    provider: byok.provider,
                    model: byok.model,
                    apiKey: byok.key,
                    temperature: resolvedTemperature,
                },
            )
            const response = await chatModel.invoke(messages)
            const text = typeof response.content === "string"
                ? response.content
                : String(response.content)
            return {
                text,
                model: byok.model,
                provider: byok.provider,
                attempts: 1,
            }
        }

        const {
            result,
            model,
            provider,
            attempts,
        } = await this.useApiService.useApi<string>(
            {
                category,
                action: async (context) => {
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
                },
            },
        )
        return {
            text: result,
            model,
            provider,
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
