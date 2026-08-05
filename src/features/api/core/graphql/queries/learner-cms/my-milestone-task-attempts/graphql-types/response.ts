import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "A single milestone-task review attempt in the learner CMS list.",
})
/**
 * One of the viewer's milestone-task review attempts, flattened for the learner
 * CMS: the task, its milestone, the owning course, the pass/score state, and
 * when it was attempted.
 */
export class MilestoneTaskAttemptItem {
    @Field(
        () => ID,
        {
            description: "Attempt id (primary key of the milestone-task attempt).",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Title of the milestone task.",
        },
    )
        taskTitle: string

    @Field(
        () => String,
        {
            description: "Title of the parent milestone.",
        },
    )
        milestoneTitle: string

    @Field(
        () => String,
        {
            description: "Title of the owning course.",
        },
    )
        courseTitle: string

    @Field(
        () => String,
        {
            description: "Opaque global id of the owning course — feed to resolveRoute.",
        },
    )
        courseGlobalId: string

    @Field(
        () => Boolean,
        {
            description: "Whether the review attempt passed.",
        },
    )
        passed: boolean

    @Field(
        () => Int,
        {
            description: "Score achieved in this attempt.",
        },
    )
        score: number

    @Field(
        () => String,
        {
            description: "When the attempt was made (ISO timestamp).",
        },
    )
        attemptedAt: string
}

@ObjectType({
    description: "Paginated list of the viewer's milestone-task review attempts.",
})
/**
 * The milestone-task-attempts page payload: the list plus the total number of
 * attempts the viewer has (for client-side pagination).
 */
export class MyMilestoneTaskAttemptsData {
    @Field(
        () => [MilestoneTaskAttemptItem],
        {
            description: "The page of milestone-task review attempts (newest first).",
        },
    )
        items: Array<MilestoneTaskAttemptItem>

    @Field(
        () => Int,
        {
            description: "Total number of attempts for the viewer (ignores paging).",
        },
    )
        total: number
}

@ObjectType({
    description: "Response wrapper for the myMilestoneTaskAttempts query.",
})
/**
 * Response wrapper for the myMilestoneTaskAttempts query.
 */
export class MyMilestoneTaskAttemptsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyMilestoneTaskAttemptsData> {
    @Field(
        () => MyMilestoneTaskAttemptsData,
        {
            nullable: true,
            description: "The page of attempts + total count.",
        },
    )
        data: MyMilestoneTaskAttemptsData
}
