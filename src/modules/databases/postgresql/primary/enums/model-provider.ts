import {
    createEnumType
} from "@modules/common"
import {
    registerEnumType
} from "@nestjs/graphql"

/**
 * Enum of model providers.
 */
export enum ModelProvider {
    /** Gemini model provider. */
    Gemini = "gemini",
    /** OpenAI model provider. */
    OpenAI = "openai",
    /**
     * Self-hosted local provider exposing an OpenAI-compatible API
     * (Ollama / vLLM / LM Studio). Routed through `ChatOpenAI` with a
     * custom `baseURL` (see `OLLAMA_BASE_URL`).
     */
    Local = "local",
    /**
     * OpenRouter — an OpenAI-compatible aggregator gateway fronting many model
     * vendors (e.g. `qwen/qwen-2.5-coder-14b-instruct`). Routed through
     * `ChatOpenAI` with a custom `baseURL` (see `OPENROUTER_BASE_URL`).
     */
    OpenRouter = "openrouter",
    /**
     * Anthropic — native Claude API (e.g. `claude-opus-4-8`). Routed through
     * `ChatAnthropic` with the Anthropic key pool. Used for the `frontier` tier.
     */
    Anthropic = "anthropic",
}

/**
 * GraphQL type for the model provider enum.
 */
export const GraphQLTypeModelProvider = createEnumType(ModelProvider)

/**
 * Register the model provider enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeModelProvider,
    {
        name: "ModelProvider",
        description: "Supported model providers.",
        valuesMap: {
            [ModelProvider.Gemini]: {
                description: "Gemini model provider.",
            },
            [ModelProvider.OpenAI]: {
                description: "OpenAI model provider.",
            },
            [ModelProvider.Local]: {
                description: "Self-hosted local provider (OpenAI-compatible API).",
            },
            [ModelProvider.OpenRouter]: {
                description: "OpenRouter — OpenAI-compatible aggregator gateway.",
            },
            [ModelProvider.Anthropic]: {
                description: "Anthropic — native Claude API (Opus / Sonnet).",
            },
        },
    }
)
