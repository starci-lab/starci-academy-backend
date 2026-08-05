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
    description: "Paginated feedback rows for the latest personal milestone-task attempt.",
})
/**
 * Paginated feedback for the caller's latest attempt on a milestone task.
 */
export class UserMilestoneTaskFeedbacksResponseData {
    @Field(
        () => [UserMilestoneTaskAttemptFeedbackEntity],
        {
            description: "Feedback rows.",
        },
    )
        data: Array<UserMilestoneTaskAttemptFeedbackEntity>

    @Field(
        () => Int,
        {
            description: "Total count for pagination.",
        },
    )
        count: number
}

@ObjectType({
    description: "Response wrapper for userMilestoneTaskFeedbacks.",
})
/**
 * Envelope for `userMilestoneTaskFeedbacks` — status metadata plus feedback page.
 */
export class UserMilestoneTaskFeedbacksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserMilestoneTaskFeedbacksResponseData>
{
    @Field(
        () => UserMilestoneTaskFeedbacksResponseData,
        {
            nullable: true,
            description: "Payload with feedback list and count.",
        },
    )
        data: UserMilestoneTaskFeedbacksResponseData
}
