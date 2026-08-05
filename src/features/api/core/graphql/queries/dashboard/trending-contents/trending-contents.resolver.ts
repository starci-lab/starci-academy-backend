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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    TrendingContentsProjectionService,
} from "@modules/bussiness/projections/trending-contents/trending-contents-projection.service"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    TrendingContentItemData,
    TrendingContentsResponse,
} from "./graphql-types/response"

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
