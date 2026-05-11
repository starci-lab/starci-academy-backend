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
export class SubmissionFeedbacksResponseData {
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
    description: "Response wrapper for the submissionFeedbacks query.",
})
export class SubmissionFeedbacksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SubmissionFeedbacksResponseData>
{
    @Field(
        () => SubmissionFeedbacksResponseData,
        {
            nullable: true,
            description: "Payload containing the list of submission feedbacks and total count.",
        },
    )
        data: SubmissionFeedbacksResponseData
}
