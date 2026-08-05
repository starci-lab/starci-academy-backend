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
    description: "Result of marking all notifications as read.",
})
/**
 * Result of marking all of the current user's notifications as read.
 */
export class MarkAllNotificationsAsReadResponseData {
    @Field(
        () => Int,
        {
            description: "Number of notifications flipped from unread to read by this call.",
        },
    )
        markedCount: number
}

@ObjectType({
    description: "Response wrapper for the markAllNotificationsAsRead mutation.",
})
/**
 * Response wrapper for the markAllNotificationsAsRead mutation.
 */
export class MarkAllNotificationsAsReadResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MarkAllNotificationsAsReadResponseData>
{
    @Field(
        () => MarkAllNotificationsAsReadResponseData,
        {
            nullable: true,
            description: "How many notifications were marked as read.",
        },
    )
        data: MarkAllNotificationsAsReadResponseData
}
