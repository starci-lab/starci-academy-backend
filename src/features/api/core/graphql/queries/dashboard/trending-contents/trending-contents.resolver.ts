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
import type {
    EntityManager,
} from "typeorm"
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
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    toGlobalId,
} from "@modules/routing"
import {
    TrendingContentItemData,
    TrendingContentsResponse,
} from "./graphql-types"
import {
    TrendingContentRow,
} from "./types"

/** Default + hard-cap on how many trending lessons to surface. */
const DEFAULT_LIMIT = 6
/** Upper bound so the client can never ask for an unbounded list. */
const MAX_LIMIT = 20

/**
 * Explore-feed discovery: the lessons read most across the platform in the last 7
 * days ("trending this week"). A bounded GROUP BY over `user_contents`; each item
 * is a route-index token resolved on click. Turns the explore feed from a social
 * stream into "find something to learn".
 */
@Resolver()
export class TrendingContentsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Trending lessons fetched successfully",
        [Locale.Vi]: "Lấy bài học nổi bật thành công",
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

        // most-read lessons in the rolling 7-day window (exclude the viewer's own
        // reads so "trending" reflects the crowd, not your own history)
        const rows = await this.entityManager.query<Array<TrendingContentRow>>(
            `
            SELECT c.id            AS "id",
                   c.title         AS "title",
                   COUNT(*)::int   AS "read_count"
            FROM user_contents uc
            JOIN contents c ON c.id = uc.content_id
            WHERE uc.is_read = true
              AND uc.user_id <> $1
              AND uc.updated_at >= now() - interval '7 days'
            GROUP BY c.id, c.title
            ORDER BY "read_count" DESC, c.title ASC
            LIMIT $2
            `,
            [
                user.id,
                take,
            ],
        )

        // map each to a clickable token + its read count
        return rows.map((row) => ({
            globalId: toGlobalId(ContentEntity.name,
                row.id),
            title: row.title,
            readCount: Number(row.read_count) || 0,
        }))
    }
}
