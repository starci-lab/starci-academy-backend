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
    UserXpProjectionService,
} from "@modules/bussiness"
import type {
    UserXpResult,
} from "@modules/bussiness"
import {
    UserXpResponse,
} from "./graphql-types"

/**
 * Public profile query: a user's XP aggregate — the per-source XP figures
 * (challenge / milestone / coding / lesson) summed from the `xp_histories` ledger
 * plus the total-XP and spendable reward-points balances. Thin read off the
 * per-user CQRS XP projection (the heavy GROUP BY runs in recompute, not per
 * request). Optional auth; a locked profile is withheld by
 * {@link GraphQLProfileVisibilityGuard}.
 */
@Resolver()
export class UserXpResolver {
    constructor(
        private readonly userXpProjectionService: UserXpProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "User XP fetched successfully",
        [Locale.Vi]: "Lấy điểm kinh nghiệm thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserXpResponse,
        {
            name: "userXp",
            description: "A user's XP aggregate (per-source XP + total/reward balances), by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose XP aggregate to fetch.",
            },
        )
            userId: string,
    ): Promise<UserXpResult> {
        // thin projection read (per-source XP + balances, TTL lazy-refreshed)
        return this.userXpProjectionService.getXp({
            userId,
        })
    }
}
