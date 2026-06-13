import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * How a single AI Lab eval case is scored against the model output.
 *
 * - {@link AiLabMetricKind.Exact}     — exact string match against the expected output.
 * - {@link AiLabMetricKind.Embedding} — cosine similarity against the expected output above a threshold.
 * - {@link AiLabMetricKind.Contains}  — the output must contain all expected substrings.
 * - {@link AiLabMetricKind.Judge}     — an LLM judge scores the output against a rubric.
 */
export enum AiLabMetricKind {
    /** Exact string match against the expected output. */
    Exact = "exact",
    /** Cosine similarity against the expected output above a threshold. */
    Embedding = "embedding",
    /** The output must contain all expected substrings. */
    Contains = "contains",
    /** An LLM judge scores the output against a rubric. */
    Judge = "judge",
}

/**
 * GraphQL type for the AI Lab metric kind enum.
 */
export const GraphQLTypeAiLabMetricKind = createEnumType(AiLabMetricKind)

/**
 * Register the AI Lab metric kind enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeAiLabMetricKind,
    {
        name: "AiLabMetricKind",
        description: "How a single AI Lab eval case is scored against the model output.",
        valuesMap: {
            [AiLabMetricKind.Exact]: {
                description: "Exact string match against the expected output.",
            },
            [AiLabMetricKind.Embedding]: {
                description: "Cosine similarity against the expected output above a threshold.",
            },
            [AiLabMetricKind.Contains]: {
                description: "The output must contain all expected substrings.",
            },
            [AiLabMetricKind.Judge]: {
                description: "An LLM judge scores the output against a rubric.",
            },
        },
    },
)
