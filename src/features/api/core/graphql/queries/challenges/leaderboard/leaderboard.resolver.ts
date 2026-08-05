import {
    Args,
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
    LeaderboardRequest,
} from "./graphql-types/request"
import {
    LeaderboardResponse,
    LeaderboardResponseData,
} from "./graphql-types/response"
import {
    LeaderboardSingleQueryService,
} from "./leaderboard.service"

@Resolver()
/**
 * GraphQL entry for `courseLeaderboard`: cached top entries plus the viewer's
 * rank, even when they sit outside the top window.
 */
export class LeaderboardResolver {
    constructor(
        private readonly service: LeaderboardSingleQueryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Leaderboard fetched successfully",
        [Locale.Vi]: "Lấy bảng xếp hạng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => LeaderboardResponse,
        {
            name: "courseLeaderboard",
            description: "Returns the cached leaderboard (top entries + viewer rank) for a course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course ID and optional page size.",
            },
        )
            request: LeaderboardRequest,
    ): Promise<LeaderboardResponseData> {
        return this.service.execute({
            request,
            user,
        })
    }
}
