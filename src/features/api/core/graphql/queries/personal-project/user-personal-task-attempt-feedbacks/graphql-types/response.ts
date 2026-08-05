import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserMilestoneTaskAttemptFeedbackEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Paginated list of user personal task attempt feedbacks.",
})
/**
 * Paginated feedback rows for one personal-task attempt id.
 */
export class UserPersonalTaskAttemptFeedbacksResponseData {
    @Field(
        () => [UserMilestoneTaskAttemptFeedbackEntity],
        {
            description: "List of user personal task attempt feedbacks.",
        },
    )
        data: Array<UserMilestoneTaskAttemptFeedbackEntity>

    @Field(
        () => Int,
        {
            description: "Total number of items matching the filters.",
        },
    )
        count: number
}

@ObjectType({
    description: "Response wrapper for the userPersonalTaskAttemptFeedbacks query.",
})
/**
 * Envelope for `userPersonalTaskAttemptFeedbacks` -- status metadata plus feedback page.
 */
export class UserPersonalTaskAttemptFeedbacksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserPersonalTaskAttemptFeedbacksResponseData>
{
    @Field(
        () => UserPersonalTaskAttemptFeedbacksResponseData,
        {
            nullable: true,
            description: "Payload containing the list of user personal task attempt feedbacks and total count.",
        },
    )
        data: UserPersonalTaskAttemptFeedbacksResponseData
}
