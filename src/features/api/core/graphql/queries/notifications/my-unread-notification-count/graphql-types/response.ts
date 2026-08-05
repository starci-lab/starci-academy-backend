import {
    Field,
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
    description: "Unread notification count for the current user.",
})
/**
 * Unread notification count for the current user (the bell badge value).
 */
export class MyUnreadNotificationCountResponseData {
    @Field(
        () => Int,
        {
            description: "Number of unread (readAt IS NULL) notifications for the user.",
        },
    )
        count: number
}

@ObjectType({
    description: "Response wrapper for the myUnreadNotificationCount query.",
})
/**
 * Response wrapper for the myUnreadNotificationCount query.
 */
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
