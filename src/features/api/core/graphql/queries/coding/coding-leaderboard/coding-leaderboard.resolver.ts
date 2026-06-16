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
    UserCodingProjectionService,
} from "@modules/bussiness"
import {
    CodingLeaderboardRequest,
    CodingLeaderboardResponse,
    type CodingLeaderboardEntryObject,
} from "./graphql-types"

/**
 * Ranks users by the number of distinct problems they've solved (Accepted).
 * Reads the count from the per-user coding projection (CQRS) — the resolver
 * stays a thin ordered read, no aggregation per request.
 */
@Resolver()
export class CodingLeaderboardResolver {
    constructor(
        private readonly userCodingProjectionService: UserCodingProjectionService,
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
        // thin read off the CQRS coding projection (count already materialised)
        return this.userCodingProjectionService.getLeaderboard({
            limit: request.limit,
        })
    }
}
