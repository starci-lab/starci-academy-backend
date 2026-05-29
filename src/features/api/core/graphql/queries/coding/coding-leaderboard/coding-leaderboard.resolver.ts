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
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    CodingProblemService,
} from "@modules/bussiness"
import {
    CodingLeaderboardRequest,
    CodingLeaderboardResponse,
    type CodingLeaderboardEntryObject,
} from "./graphql-types"

/**
 * Ranks users by the number of distinct problems they've solved (Accepted).
 */
@Resolver()
export class CodingLeaderboardResolver {
    constructor(
        private readonly codingProblemService: CodingProblemService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding leaderboard fetched successfully",
        [Locale.Vi]: "Lấy bảng xếp hạng thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CodingLeaderboardResponse,
        {
            name: "codingLeaderboard",
            description: "Ranks users by number of distinct solved coding problems.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Leaderboard parameters.",
            },
        )
            request: CodingLeaderboardRequest,
    ): Promise<Array<CodingLeaderboardEntryObject>> {
        // delegate to the domain service for the ranked entries
        return this.codingProblemService.leaderboard({
            limit: request.limit,
        })
    }
}
