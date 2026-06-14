import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Unread notification count for the current user (the bell badge value).
 */
@ObjectType({
    description: "Unread notification count for the current user.",
})
export class MyUnreadNotificationCountResponseData {
    @Field(
        () => Int,
        {
            description: "Number of unread (readAt IS NULL) notifications for the user.",
        },
    )
        count: number
}

/**
 * Response wrapper for the myUnreadNotificationCount query.
 */
@ObjectType({
    description: "Response wrapper for the myUnreadNotificationCount query.",
})
export class MyUnreadNotificationCountResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyUnreadNotificationCountResponseData>
{
    @Field(
        () => MyUnreadNotificationCountResponseData,
        {
            nullable: true,
            description: "Unread notification count for the current user.",
        },
    )
        data: MyUnreadNotificationCountResponseData
}
