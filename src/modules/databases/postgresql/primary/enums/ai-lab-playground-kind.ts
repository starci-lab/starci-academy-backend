import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * The kind of AI Lab playground, which drives which UI surface and backend
 * pipeline a lesson's playground uses.
 *
 * - {@link AiLabPlaygroundKind.Prompt}     — plain prompt sandbox (system + user prompt → model).
 * - {@link AiLabPlaygroundKind.Rag}        — retrieval-augmented playground backed by a Qdrant collection.
 * - {@link AiLabPlaygroundKind.Comparison} — fan-out comparison across multiple models/providers.
 */
export enum AiLabPlaygroundKind {
    /** Plain prompt sandbox (system + user prompt → model). */
    Prompt = "prompt",
    /** Retrieval-augmented playground backed by a Qdrant collection. */
    Rag = "rag",
    /** Fan-out comparison across multiple models/providers. */
    Comparison = "comparison",
}

/**
 * GraphQL type for the AI Lab playground kind enum.
 */
export const GraphQLTypeAiLabPlaygroundKind = createEnumType(AiLabPlaygroundKind)

/**
 * Register the AI Lab playground kind enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeAiLabPlaygroundKind,
    {
        name: "AiLabPlaygroundKind",
        description: "The kind of AI Lab playground (prompt / rag / comparison).",
        valuesMap: {
            [AiLabPlaygroundKind.Prompt]: {
                description: "Plain prompt sandbox (system + user prompt → model).",
            },
            [AiLabPlaygroundKind.Rag]: {
                description: "Retrieval-augmented playground backed by a Qdrant collection.",
            },
            [AiLabPlaygroundKind.Comparison]: {
                description: "Fan-out comparison across multiple models/providers.",
            },
        },
    },
)
