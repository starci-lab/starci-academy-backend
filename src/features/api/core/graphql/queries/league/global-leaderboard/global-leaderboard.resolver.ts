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
    LeagueService,
} from "@modules/bussiness/league/league.service"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    GlobalLeaderboardData,
    GlobalLeaderboardResponse,
} from "./graphql-types/response"

/** How many top users the global leaderboard returns. */
const TOP_LIMIT = 50

@Resolver()
/**
 * Global-leaderboard query: the all-users board ranked by total reward points.
 * Returns the top {@link TOP_LIMIT} users (each user id encoded as an opaque
 * global id) plus the viewer's own rank + points so the client can append a
 * "you" row when the viewer sits outside the visible top.
 */
export class GlobalLeaderboardResolver {
    constructor(
        private readonly leagueService: LeagueService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Global leaderboard fetched successfully",
        [Locale.Vi]: "Lấy bảng xếp hạng tổng thể thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => GlobalLeaderboardResponse,
        {
            name: "globalLeaderboard",
            description: "The all-users leaderboard ranked by total points (top N + viewer's standing).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<GlobalLeaderboardData> {
        // read the top users + the viewer's own standing
        const board = await this.leagueService.getGlobalLeaderboard(user.id,
            TOP_LIMIT)
        // map each ranked user to the wire shape, encoding the user id as opaque
        const entries = board.entries.map((entry) => ({
            userGlobalId: toGlobalId(UserEntity.name,
                entry.userId),
            username: entry.username,
            avatar: entry.avatar,
            points: entry.points,
            rank: entry.rank,
        }))
        return {
            entries,
            myRank: board.myRank,
            myPoints: board.myPoints,
        }
    }
}
