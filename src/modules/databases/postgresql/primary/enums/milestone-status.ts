import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Status of a user's milestone progress.
 */
export enum MilestoneStatus {
    /**
     * Milestone is not yet available (previous milestone incomplete).
     */
    Locked = "locked",
    /**
     * Milestone is currently in progress.
     */
    InProgress = "in_progress",
    /**
     * Milestone has been completed.
     */
    Completed = "completed",
}

/**
 * GraphQL type for the milestone status enum.
 */
export const GraphQLTypeMilestoneStatus = createEnumType(
    MilestoneStatus,
)

/**
 * Register the milestone status enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeMilestoneStatus,
    {
        name: "MilestoneStatus",
        description: "Status of a user's milestone progress.",
        valuesMap: {
            [MilestoneStatus.Locked]: {
                description: "Milestone is not yet available (previous milestone incomplete).",
            },
            [MilestoneStatus.InProgress]: {
                description: "Milestone is currently in progress.",
            },
            [MilestoneStatus.Completed]: {
                description: "Milestone has been completed.",
            },
        },
    })
