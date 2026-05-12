import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Status of a user's task plan progress.
 */
export enum TaskPlanStatus {
    /**
     * Task plan is not yet available.
     */
    Locked = "locked",
    /**
     * Task plan is currently in progress.
     */
    InProgress = "in_progress",
    /**
     * Task plan has been completed.
     */
    Completed = "completed",
}

/**
 * GraphQL type for the task plan status enum.
 */
export const GraphQLTypeTaskPlanStatus = createEnumType(
    TaskPlanStatus,
)

/**
 * Register the task plan status enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeTaskPlanStatus,
    {
        name: "TaskPlanStatus",
        description: "Status of a user's task plan progress.",
        valuesMap: {
            [TaskPlanStatus.Locked]: {
                description: "Task plan is not yet available.",
            },
            [TaskPlanStatus.InProgress]: {
                description: "Task plan is currently in progress.",
            },
            [TaskPlanStatus.Completed]: {
                description: "Task plan has been completed.",
            },
        },
    })
