import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CommunityFeedPageObject,
} from "../../../../shared/community"

/** Response wrapper for the communityFeed query. */
@ObjectType({
    description: "Response wrapper for the communityFeed query.",
})
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
