import {
    Args,
    ID,
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
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    GraphQLProfileVisibilityGuard,
    UserStatsProjectionService,
} from "@modules/bussiness"
import {
    MyWeeklyStatsData,
} from "../../dashboard/my-weekly-stats/graphql-types"
import {
    UserWeeklyStatsResponse,
} from "./graphql-types"

@Resolver()
/**
 * Public profile query: a given user's streak + rolling 7-day activity. Mirrors
 * `myWeeklyStats` but reads for the user named in the route (id from args), so a
 * profile can show a Duolingo-style streak. Optional auth — anonymous viewers may
 * call it; a locked profile is withheld from non-owners by
 * {@link GraphQLProfileVisibilityGuard}. Reads the user-stats projection.
 */
export class UserWeeklyStatsResolver {
    constructor(
        private readonly userStatsProjectionService: UserStatsProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Weekly stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê tuần thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserWeeklyStatsResponse,
        {
            name: "userWeeklyStats",
            description: "A user's streak + rolling 7-day activity stats, by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose weekly stats to fetch.",
            },
        )
            userId: string,
    ): Promise<MyWeeklyStatsData> {
        // single projection read — heavy aggregates live in the projection recompute
        const stats = await this.userStatsProjectionService.getStats(userId)
        // expose only the activity slice (the projection also carries social counters)
        return {
            streak: stats.streak,
            longestStreak: stats.longestStreak,
            xp: stats.weeklyXp,
            lessons: stats.weeklyLessons,
            days: stats.last7Days,
            // the weekly goal is the owner's private target — not surfaced when
            // viewing another user's public stats
            weeklyGoalLessons: null,
            // streak-freeze inventory is the owner's private currency — surfaced
            // only on the viewer's own myWeeklyStats, 0 here for other users
            streakFreezes: 0,
        }
    }
}
