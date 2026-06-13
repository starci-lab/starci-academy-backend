import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Lifecycle status of a single AI Lab playground run.
 *
 * - {@link AiLabRunStatus.Streaming} — the model output is still streaming over the gateway.
 * - {@link AiLabRunStatus.Completed} — the run finished and the full output was persisted.
 * - {@link AiLabRunStatus.Failed}    — the run errored or was aborted by the learner.
 * - {@link AiLabRunStatus.Cached}    — the output was served from a previous identical run (no model call).
 */
export enum AiLabRunStatus {
    /** The model output is still streaming over the gateway. */
    Streaming = "streaming",
    /** The run finished and the full output was persisted. */
    Completed = "completed",
    /** The run errored or was aborted by the learner. */
    Failed = "failed",
    /** The output was served from a previous identical run (no model call). */
    Cached = "cached",
}

/**
 * GraphQL type for the AI Lab run status enum.
 */
export const GraphQLTypeAiLabRunStatus = createEnumType(AiLabRunStatus)

/**
 * Register the AI Lab run status enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeAiLabRunStatus,
    {
        name: "AiLabRunStatus",
        description: "Lifecycle status of a single AI Lab playground run.",
        valuesMap: {
            [AiLabRunStatus.Streaming]: {
                description: "The model output is still streaming over the gateway.",
            },
            [AiLabRunStatus.Completed]: {
                description: "The run finished and the full output was persisted.",
            },
            [AiLabRunStatus.Failed]: {
                description: "The run errored or was aborted by the learner.",
            },
            [AiLabRunStatus.Cached]: {
                description: "The output was served from a previous identical run (no model call).",
            },
        },
    },
)
