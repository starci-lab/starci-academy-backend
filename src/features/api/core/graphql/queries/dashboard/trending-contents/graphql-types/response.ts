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
 * One trending lesson for the "discover what to learn" rail in the explore feed —
 * a route-index token (resolves its route on click) plus its recent read count.
 */
@ObjectType({
    description: "A trending lesson (read count over the last 7 days).",
})
export class TrendingContentItemData {
    @Field(
        () => String,
        {
            description: "Opaque global id of the content — pass to resolveRoute on click.",
        },
    )
        globalId: string

    @Field(
        () => String,
        {
            description: "Lesson title (the token label).",
        },
    )
        title: string

    @Field(
        () => Int,
        {
            description: "Times the lesson was read in the last 7 days.",
        },
    )
        readCount: number
}

/**
 * Response wrapper for the trendingContents query.
 */
@ObjectType({
    description: "Response wrapper for the trendingContents query.",
})
export class TrendingContentsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<TrendingContentItemData>> {
    @Field(
        () => [TrendingContentItemData],
        {
            description: "Top lessons read this week, most-read first.",
        },
    )
        data: Array<TrendingContentItemData>
}
