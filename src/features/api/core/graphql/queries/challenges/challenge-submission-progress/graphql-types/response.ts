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
    description: "Single challenge progress item.",
})
/**
 * One challenge's progress for the viewer's enrollment: score, completion,
 * and derived lifecycle status.
 */
export class ChallengeSubmissionProgressItemData {
    @Field(
        () => String,
        {
            description: "Challenge ID.",
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
            description: "Maximum possible score for this challenge.",
        },
    )
        maxScore: number

    @Field(
        () => Boolean,
        {
            description: "Whether the challenge is completed (every submission submitted and passed).",
        },
    )
        completed: boolean

    @Field(
        () => String,
        {
            description: "Lifecycle state: notStarted | inProgress | failed | completed.",
        },
    )
        status: string

    @Field(
        () => Int,
        {
            description: "Total number of attempts across all submissions.",
        },
    )
        numAttempts: number
}

@ObjectType({
    description: "Challenge submission progress data.",
})
/**
 * All challenges in the requested course, each with the viewer's progress.
 */
export class ChallengeSubmissionProgressResponseData {
    @Field(
        () => [ChallengeSubmissionProgressItemData],
        {
            description: "List of challenges with their completion status.",
        },
    )
        completionTasks: Array<ChallengeSubmissionProgressItemData>
}

@ObjectType({
    description: "Response wrapper for the challengeSubmissionProgress query.",
})
/**
 * Response wrapper for the `challengeSubmissionProgress` query.
 */
export class ChallengeSubmissionProgressResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChallengeSubmissionProgressResponseData>
{
    @Field(
        () => ChallengeSubmissionProgressResponseData,
        {
            nullable: true,
            description: "Payload containing challenge submission progress.",
        },
    )
        data: ChallengeSubmissionProgressResponseData
}
