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
    CommunityFeedPageObject,
} from "../../../../shared/community/object-types/community-feed-page.object"

@ObjectType({
    description: "Response wrapper for the communityFeed query.",
})
/** Response wrapper for the communityFeed query. */
export class CommunityFeedResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommunityFeedPageObject>
{
    /** A page of community feed posts + next cursor. */
    @Field(
        () => CommunityFeedPageObject,
        {
            nullable: true,
            description: "A page of community feed posts + next cursor.",
        },
    )
        data: CommunityFeedPageObject
}
