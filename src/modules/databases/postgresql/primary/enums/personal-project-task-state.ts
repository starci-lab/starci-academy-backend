import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * State of a personal project task.
 */
export enum PersonalProjectTaskState {
    /**
     * Task has not been started yet.
     */
    Todo = "todo",
    /**
     * Task is currently being worked on.
     */
    InProgress = "inProgress",
    /**
     * Task has been completed and passed.
     */
    Completed = "completed",
}

/**
 * GraphQL type for the personal project task state enum.
 */
export const GraphQLTypePersonalProjectTaskState = createEnumType(
    PersonalProjectTaskState,
)

/**
 * Register the personal project task state enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypePersonalProjectTaskState,
    {
        name: "PersonalProjectTaskState",
        description: "State of a personal project task.",
        valuesMap: {
            [PersonalProjectTaskState.Todo]: {
                description: "Task has not been started yet.",
            },
            [PersonalProjectTaskState.InProgress]: {
                description: "Task is currently being worked on.",
            },
            [PersonalProjectTaskState.Completed]: {
                description: "Task has been completed and passed.",
            },
        },
    })
