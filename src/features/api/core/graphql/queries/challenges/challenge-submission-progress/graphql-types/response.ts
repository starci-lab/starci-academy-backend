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
            description: "Whether the challenge is completed (passed).",
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
    description: "Challenge submission progress data.",
})
export class ChallengeSubmissionProgressResponseData {
    @Field(
        () => [ChallengeSubmissionProgressItemData],
        {
            description: "List of challenges with their completion status.",
        },
    )
        completionTasks: Array<ChallengeSubmissionProgressItemData>

    @Field(
        () => ChallengeSubmissionProgressItemData,
        {
            nullable: true,
            description: "The current (first uncompleted) challenge, or null if all completed.",
        },
    )
        currentTask: ChallengeSubmissionProgressItemData | null
}

@ObjectType({
    description: "Response wrapper for the challengeSubmissionProgress query.",
})
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
