import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A passed capstone (milestone) task on a user's profile.",
})
/**
 * One passed capstone (personal-project milestone) task on a user's profile --
 * a verified piece of project work: the task + its milestone + course, the score,
 * and when it was passed. Deduped to one row per task (the latest passing attempt).
 */
export class UserCapstoneTaskItemData {
    @Field(
        () => String,
        {
            description: "Opaque global id of the course the task belongs to — feed to resolveRoute.",
        },
    )
        courseGlobalId: string

    @Field(
        () => String,
        {
            description: "Course title (the token label).",
        },
    )
        courseTitle: string

    @Field(
        () => String,
        {
            description: "Milestone title the task belongs to.",
        },
    )
        milestoneTitle: string

    @Field(
        () => String,
        {
            description: "Milestone-task title.",
        },
    )
        taskTitle: string

    @Field(
        () => Int,
        {
            description: "Score achieved on the passing attempt.",
        },
    )
        score: number

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the task was passed (processed), or null when unknown.",
        },
    )
        passedAt: Date | null
}

@ObjectType({
    description: "Response wrapper for the userCapstoneTasks query.",
})
/**
 * Response wrapper for the userCapstoneTasks query.
 */
export class UserCapstoneTasksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<UserCapstoneTaskItemData>> {
    @Field(
        () => [UserCapstoneTaskItemData],
        {
            description: "The user's passed capstone tasks, newest first.",
        },
    )
        data: Array<UserCapstoneTaskItemData>
}
