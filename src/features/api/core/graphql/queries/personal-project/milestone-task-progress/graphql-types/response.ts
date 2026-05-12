import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Single task progress item.",
})
export class MilestoneTaskProgressItemData {
    @Field(
        () => String,
        {
            description: "Milestone task ID.",
        },
    )
        id: string

    @Field(
        () => Float,
        {
            description: "Score from the latest attempt.",
        },
    )
        lastScore: number

    @Field(
        () => Float,
        {
            description: "Maximum possible score for this task.",
        },
    )
        maxScore: number

    @Field(
        () => Boolean,
        {
            description: "Whether the task is completed (passed).",
        },
    )
        completed: boolean

    @Field(
        () => Int,
        {
            description: "Total number of attempts.",
        },
    )
        numAttempts: number
}

@ObjectType({
    description: "Milestone task progress data.",
})
export class MilestoneTaskProgressResponseData {
    @Field(
        () => [MilestoneTaskProgressItemData],
        {
            description: "List of tasks with their completion status.",
        },
    )
        completionTasks: Array<MilestoneTaskProgressItemData>

    @Field(
        () => MilestoneTaskProgressItemData,
        {
            nullable: true,
            description: "The current (first uncompleted) task, or null if all completed.",
        },
    )
        currentTask: MilestoneTaskProgressItemData | null
}

@ObjectType({
    description: "Response wrapper for the milestoneTaskProgress query.",
})
export class MilestoneTaskProgressResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MilestoneTaskProgressResponseData>
{
    @Field(
        () => MilestoneTaskProgressResponseData,
        {
            nullable: true,
            description: "Payload containing milestone task progress.",
        },
    )
        data: MilestoneTaskProgressResponseData
}
