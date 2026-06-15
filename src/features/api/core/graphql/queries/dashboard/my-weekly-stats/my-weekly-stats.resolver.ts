import {
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
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    UserStatsProjectionService,
} from "@modules/bussiness"
import {
    MyWeeklyStatsData,
    MyWeeklyStatsResponse,
} from "./graphql-types"

/**
 * Rail query: the "this week" widget stats. Reads straight from the user-stats
 * projection (streak / weekly XP / weekly lessons are precomputed there by a
 * scoped UPSERT, kept fresh via CDC + a TTL lazy-refresh on read), so the resolver
 * never runs the aggregates inline.
 */
@Resolver()
export class MyWeeklyStatsResolver {
    constructor(
        private readonly userStatsProjectionService: UserStatsProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Weekly stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê tuần thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyWeeklyStatsResponse,
        {
            name: "myWeeklyStats",
            description: "Rolling 7-day activity stats (streak / XP / lessons).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyWeeklyStatsData> {
        // single projection read — the heavy aggregates live in the projection's
        // recompute, not here
        const stats = await this.userStatsProjectionService.getStats(user.id)
        // expose only the activity slice (the projection also carries social/inbox
        // counters used elsewhere)
        return {
            streak: stats.streak,
            longestStreak: stats.longestStreak,
            xp: stats.weeklyXp,
            lessons: stats.weeklyLessons,
            days: stats.last7Days,
        }
    }
}
