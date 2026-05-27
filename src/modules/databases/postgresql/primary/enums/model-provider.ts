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
    /** Anthropic Claude model provider. */
    Claude = "claude",
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
            [ModelProvider.Claude]: {
                description: "Anthropic Claude model provider.",
            },
        },
    }
)