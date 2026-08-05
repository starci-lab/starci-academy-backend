import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    MyFeedResponseData,
} from "../../../dashboard/my-feed/graphql-types"

@ObjectType({
    description: "Response wrapper for the userFeed query.",
})
/**
 * Response wrapper for the userFeed query.
 *
 * Reuses {@link MyFeedResponseData} (items + nextCursor): each item is one
 * activity the profile owner performed, newest first. Differs from `myFeed`
 * only in subject and ordering — a single user's chronological timeline rather
 * than the score-ranked home feed.
 */
export class UserFeedResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFeedResponseData> {
    @Field(
        () => MyFeedResponseData,
        {
            nullable: true,
            description: "A page of the user's activity items + next cursor.",
        },
    )
        data: MyFeedResponseData
}
