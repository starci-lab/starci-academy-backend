import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    FollowerUserData,
} from "../../user-followers/graphql-types"

@ObjectType({
    description: "Response wrapper for the userFollowing query.",
})
/**
 * Response wrapper for the userFollowing query — the users a profile follows
 * (most recent first). Reuses {@link FollowerUserData} as the list-item shape
 * (opaque id + username + display name + avatar) since followers and following
 * render identically in the follow-list modal.
 */
export class UserFollowingResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<FollowerUserData>> {
    @Field(
        () => [FollowerUserData],
        {
            description: "Users this profile follows, most recent first.",
        },
    )
        data: Array<FollowerUserData>
}
