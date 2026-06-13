import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Lifecycle status of an AI Lab eval challenge submission run.
 *
 * - {@link AiLabEvalRunStatus.Pending}   — enqueued, waiting for the grading worker.
 * - {@link AiLabEvalRunStatus.Grading}   — the worker is grading the eval cases.
 * - {@link AiLabEvalRunStatus.Completed} — grading finished and the verdict was persisted.
 * - {@link AiLabEvalRunStatus.Failed}    — the grading job errored.
 */
export enum AiLabEvalRunStatus {
    /** Enqueued, waiting for the grading worker. */
    Pending = "pending",
    /** The worker is grading the eval cases. */
    Grading = "grading",
    /** Grading finished and the verdict was persisted. */
    Completed = "completed",
    /** The grading job errored. */
    Failed = "failed",
}

/**
 * GraphQL type for the AI Lab eval run status enum.
 */
export const GraphQLTypeAiLabEvalRunStatus = createEnumType(AiLabEvalRunStatus)

/**
 * Register the AI Lab eval run status enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeAiLabEvalRunStatus,
    {
        name: "AiLabEvalRunStatus",
        description: "Lifecycle status of an AI Lab eval challenge submission run.",
        valuesMap: {
            [AiLabEvalRunStatus.Pending]: {
                description: "Enqueued, waiting for the grading worker.",
            },
            [AiLabEvalRunStatus.Grading]: {
                description: "The worker is grading the eval cases.",
            },
            [AiLabEvalRunStatus.Completed]: {
                description: "Grading finished and the verdict was persisted.",
            },
            [AiLabEvalRunStatus.Failed]: {
                description: "The grading job errored.",
            },
        },
    },
)
