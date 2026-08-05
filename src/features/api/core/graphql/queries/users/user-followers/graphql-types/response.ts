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

@ObjectType({
    description: "A follower of a user (avatar-group item).",
})
/**
 * One follower rendered in the profile's "who follows" avatar group -- the opaque
 * global id (resolved to the profile route on click) plus the header fields the
 * avatar + tooltip need.
 */
export class FollowerUserData {
    @Field(
        () => String,
        {
            description: "Opaque global id of the follower — pass to resolveRoute on click.",
        },
    )
        globalId: string

    @Field(
        () => String,
        {
            description: "Username (the @handle and profile route segment).",
        },
    )
        username: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Display name; null when unset (the UI falls back to username).",
        },
    )
        displayName: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Avatar public URL; null when the user has none.",
        },
    )
        avatar: string | null
}

@ObjectType({
    description: "Response wrapper for the userFollowers query.",
})
/**
 * Response wrapper for the userFollowers query.
 */
export class UserFollowersResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<FollowerUserData>> {
    @Field(
        () => [FollowerUserData],
        {
            description: "Followers of the user, most recent first.",
        },
    )
        data: Array<FollowerUserData>
}
