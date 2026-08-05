import {
    Args,
    Int,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    ContentEntity,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    TrendingContentsProjectionService,
} from "@modules/bussiness"
import {
    toGlobalId,
} from "@modules/routing"
import {
    TrendingContentItemData,
    TrendingContentsResponse,
} from "./graphql-types"

/** Default + hard-cap on how many trending lessons to surface. */
const DEFAULT_LIMIT = 6
/** Upper bound so the client can never ask for an unbounded list. */
const MAX_LIMIT = 20

@Resolver()
/**
 * Explore-feed discovery: the lessons read most across the platform in the last 7
 * days ("trending this week"). Reads the materialised top-N board from the CQRS
 * trending projection (the heavy GROUP BY runs in the projection, not per
 * request); the projection also drops lessons the viewer already read so trending
 * reflects the crowd. Each item is a route-index token resolved on click.
 */
export class TrendingContentsResolver {
    constructor(
        private readonly trendingContentsProjectionService: TrendingContentsProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Trending lessons fetched successfully",
        [Locale.Vi]: "Lấy bài học nổi bật thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => TrendingContentsResponse,
        {
            name: "trendingContents",
            description: "Top lessons read across the platform in the last 7 days.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: DEFAULT_LIMIT,
                description: "Max lessons to return.",
            })
            limit: number,
    ): Promise<Array<TrendingContentItemData>> {
        // clamp the page size into [1, MAX_LIMIT]
        const take = Math.min(Math.max(limit ?? DEFAULT_LIMIT,
            1),
        MAX_LIMIT)

        // thin read off the CQRS trending projection (viewer's own reads excluded)
        const items = await this.trendingContentsProjectionService.getTrending({
            limit: take,
            viewerId: user.id,
        })

        // map each to a clickable token + its read count
        return items.map((item) => ({
            globalId: toGlobalId(ContentEntity.name,
                item.id),
            title: item.title,
            readCount: item.readCount,
        }))
    }
}
