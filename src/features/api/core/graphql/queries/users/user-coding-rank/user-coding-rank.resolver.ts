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
    UserCodingProjectionService,
} from "@modules/bussiness"
import {
    CodingRankObject,
    UserCodingRankResponse,
} from "./graphql-types"

/**
 * Public profile query: a user's DERIVED coding standing — a 1-based global rank
 * + a percentile by distinct solved coding problems (same ordering as the coding
 * leaderboard). Thin read off the per-user CQRS coding projection (computed in a
 * single pass over the materialised solved counts — no aggregation per request).
 * Both fields null when the user has 0 solves.
 * Optional auth; a locked profile is withheld by {@link GraphQLProfileVisibilityGuard}.
 */
@Resolver()
export class UserCodingRankResolver {
    constructor(
        private readonly userCodingProjectionService: UserCodingProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding rank fetched successfully",
        [Locale.Vi]: "Lấy thứ hạng lập trình thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserCodingRankResponse,
        {
            name: "userCodingRank",
            description: "A user's derived coding rank + percentile by distinct solved problems, by user id (null when 0 solves).",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose coding rank to fetch.",
            },
        )
            userId: string,
    ): Promise<CodingRankObject> {
        // thin projection read (rank + percentile computed over the materialised solved counts)
        return this.userCodingProjectionService.getRank({
            userId,
        })
    }
}
