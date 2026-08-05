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
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserCodingProjectionService,
} from "@modules/bussiness/projections/user-coding/user-coding-projection.service"
import {
    CodingLeaderboardRequest,
} from "./graphql-types/request"
import {
    CodingLeaderboardResponse,
    type CodingLeaderboardEntryObject,
} from "./graphql-types/response"

@Resolver()
/**
 * Ranks users by the number of distinct problems they've solved (Accepted).
 * Reads the count from the per-user coding projection (CQRS) -- the resolver
 * stays a thin ordered read, no aggregation per request.
 */
export class CodingLeaderboardResolver {
    constructor(
        private readonly userCodingProjectionService: UserCodingProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding leaderboard fetched successfully",
        [Locale.Vi]: "Lấy bảng xếp hạng thành công", // vn-ok: vi-locale string emitted to clients
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
