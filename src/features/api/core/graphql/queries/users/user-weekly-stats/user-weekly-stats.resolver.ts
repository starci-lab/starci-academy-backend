import {
    Args,
    Context,
    ID,
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
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    UserStatsProjectionService,
} from "@modules/bussiness"
import {
    MyWeeklyStatsData,
} from "../../dashboard/my-weekly-stats/graphql-types"
import {
    isProfileHiddenFromViewer,
} from "../utils"
import {
    UserWeeklyStatsResponse,
} from "./graphql-types"

/**
 * Public profile query: a given user's streak + rolling 7-day activity. Mirrors
 * `myWeeklyStats` but reads for the user named in the route (id from args), so a
 * profile can show a Duolingo-style streak. Optional auth — anonymous viewers may
 * call it. A locked profile yields empty stats to anyone but the owner (also
 * gated client-side). Reads the user-stats projection (never computed inline).
 */
@Resolver()
export class UserWeeklyStatsResolver {
    constructor(
        private readonly userStatsProjectionService: UserStatsProjectionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Weekly stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê tuần thành công",
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
        @Context()
            context: { req?: { user?: { id?: string } } },
    ): Promise<MyWeeklyStatsData> {
        // locked profile → withhold the streak from everyone but the owner
        if (await isProfileHiddenFromViewer({
            entityManager: this.entityManager,
            userId,
            viewerId: context.req?.user?.id,
        })) {
            // empty stats for a hidden profile (no streak leaked)
            return {
                streak: 0,
                longestStreak: 0,
                xp: 0,
                lessons: 0,
                days: [],
            }
        }
        // single projection read — heavy aggregates live in the projection recompute
        const stats = await this.userStatsProjectionService.getStats(userId)
        // expose only the activity slice (the projection also carries social counters)
        return {
            streak: stats.streak,
            longestStreak: stats.longestStreak,
            xp: stats.weeklyXp,
            lessons: stats.weeklyLessons,
            days: stats.last7Days,
        }
    }
}
