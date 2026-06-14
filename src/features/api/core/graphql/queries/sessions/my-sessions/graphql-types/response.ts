import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    LoginSessionObject,
} from "./object"

@ObjectType({
    description: "The current user's active login sessions (most-recently-seen first).",
})
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
