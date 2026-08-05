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
    LeaderboardRequest,
    LeaderboardResponse,
    LeaderboardResponseData,
} from "./graphql-types"
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
        [Locale.Vi]: "Lấy bảng xếp hạng thành công",
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
