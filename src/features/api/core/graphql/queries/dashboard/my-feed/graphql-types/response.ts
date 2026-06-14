import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    MyDashboardFeedItemData,
} from "../../my-dashboard/graphql-types"

/** One cursor-paginated page of the home feed. */
@ObjectType({
    description: "A cursor-paginated page of home-feed activity items.",
})
export class MyFeedResponseData {
    @Field(
        () => [MyDashboardFeedItemData],
        {
            description: "Feed items for this page, newest first.",
        },
    )
        items: Array<MyDashboardFeedItemData>

    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor for the next page; null when there are no more items.",
        },
    )
        nextCursor: string | null
}

/** Response wrapper for the myFeed query. */
@ObjectType({
    description: "Response wrapper for the myFeed query.",
})
export class MyFeedResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFeedResponseData>
{
    @Field(
        () => MyFeedResponseData,
        {
            nullable: true,
            description: "A page of feed items + next cursor.",
        },
    )
        data: MyFeedResponseData
}
