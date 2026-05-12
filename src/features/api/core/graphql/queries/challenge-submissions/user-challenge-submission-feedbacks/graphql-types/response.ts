import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserChallengeSubmissionFeedbackEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Paginated list of submission feedbacks.",
})
export class UserChallengeSubmissionFeedbacksResponseData {
    @Field(
        () => [UserChallengeSubmissionFeedbackEntity],
        {
            description: "List of submission feedbacks.",
        },
    )
        data: Array<UserChallengeSubmissionFeedbackEntity>

    @Field(
        () => Int,
        {
            description: "Total number of items matching the filters.",
        },
    )
        count: number
}

@ObjectType({
    description: "Response wrapper for the userChallengeSubmissionFeedbacks query.",
})
export class UserChallengeSubmissionFeedbacksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserChallengeSubmissionFeedbacksResponseData>
{
    @Field(
        () => UserChallengeSubmissionFeedbacksResponseData,
        {
            nullable: true,
            description: "Payload containing the list of submission feedbacks and total count.",
        },
    )
        data: UserChallengeSubmissionFeedbacksResponseData
}
