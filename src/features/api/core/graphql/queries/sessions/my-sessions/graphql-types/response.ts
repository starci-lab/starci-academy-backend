import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    LoginSessionObject,
} from "./object"

@ObjectType({
    description: "The current user's active login sessions (most-recently-seen first).",
})
/**
 * Payload of `mySessions`: active devices newest-seen first so the
 * security page can list them and flag the current one for revoke UX.
 */
export class MySessionsResponseData {
    @Field(
        () => [LoginSessionObject],
        {
            description: "All active device sessions for the current user.",
        },
    )
        data: Array<LoginSessionObject>
}

@ObjectType({
    description: "Response wrapper for the mySessions query.",
})
/**
 * GraphQL envelope for `mySessions`. Auth-only -- unauthenticated callers
 * never see another user's device list.
 */
export class MySessionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MySessionsResponseData>
{
    @Field(
        () => MySessionsResponseData,
        {
            nullable: true,
            description: "Payload containing the list of active device sessions.",
        },
    )
        data: MySessionsResponseData
}
