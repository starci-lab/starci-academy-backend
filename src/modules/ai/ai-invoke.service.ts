import {
    Injectable,
} from "@nestjs/common"
import {
    ChatOpenAI,
} from "@langchain/openai"
import {
    ChatGoogleGenerativeAI,
} from "@langchain/google-genai"
import type {
    BaseMessage,
} from "@langchain/core/messages"
import {
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import {
    UnsupportedAiProviderException,
} from "@modules/exceptions"
import {
    UseApiService,
} from "./balancer"

/**
 * Bring-your-own-key descriptor — when present on {@link AiInvokeParams} the
 * balancer is bypassed entirely and this exact `{provider, model, key}` is used.
 */
export interface AiInvokeByok {
    /** Provider whose SDK client to build (OpenAI/Gemini only). */
    provider: ModelProvider
    /** Concrete model name to invoke. */
    model: string
    /** The user's own raw API key. */
    key: string
}

/** Params for {@link AiInvokeService.invoke}. */
export interface AiInvokeParams {
    /** Chat messages (system + human) to send to the model. */
    messages: Array<BaseMessage>
    /** Optional category filter — restricts the fallback chain to one tier. */
    category?: AiModelCategory
    /**
     * Optional bring-your-own-key descriptor. When provided, the shared key
     * pool / fallback chain is skipped and this exact key/model is used once.
     */
    byok?: AiInvokeByok
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
}

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
        }: AiInvokeParams,
    ): Promise<AiInvokeResult> {
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
        }: {
            provider: ModelProvider
            model: string
            apiKey: string
        },
    ): ChatOpenAI | ChatGoogleGenerativeAI {
        switch (provider) {
        case ModelProvider.OpenAI:
            return new ChatOpenAI(
                {
                    model,
                    apiKey,
                },
            )
        case ModelProvider.Gemini:
            return new ChatGoogleGenerativeAI(
                {
                    model,
                    apiKey,
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
