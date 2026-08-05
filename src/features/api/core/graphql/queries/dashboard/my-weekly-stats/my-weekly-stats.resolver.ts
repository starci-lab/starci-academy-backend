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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    MyWeeklyStatsData,
    MyWeeklyStatsResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Rail query: the "this week" widget stats. Reads straight from the user-stats
 * projection (streak / weekly XP / weekly lessons are precomputed there by a
 * scoped UPSERT, kept fresh via CDC + a TTL lazy-refresh on read), so the resolver
 * never runs the aggregates inline.
 */
export class MyWeeklyStatsResolver {
    constructor(
        private readonly userStatsProjectionService: UserStatsProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Weekly stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê tuần thành công", // vn-ok: vi-locale string emitted to clients
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
        // single projection read -- the heavy aggregates live in the projection's
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
            // the goal lives on the user row (set via setWeeklyGoal), not the
            // projection -- read it straight off the guard-attached user
            weeklyGoalLessons: user.weeklyGoalLessons,
            // streak-freeze inventory also lives on the user row (bought via
            // buyStreakFreeze, consumed by the daily auto-protect cron)
            streakFreezes: user.streakFreezes,
        }
    }
}
