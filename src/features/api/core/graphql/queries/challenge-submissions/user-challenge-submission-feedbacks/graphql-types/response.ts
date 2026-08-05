import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserChallengeSubmissionFeedbackEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-feedback.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Paginated list of submission feedbacks.",
})
/**
 * One page of scorer feedback items for an attempt, plus the unpaginated
 * match count for page controls.
 */
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
/**
 * Envelope for `userChallengeSubmissionFeedbacks`. Auth is required at the
 * resolver; the handler itself does not re-check ownership of the attempt.
 */
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
