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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
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
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness/guards/graphql-profile-visibility.guard"
import {
    UserXpProjectionService,
} from "@modules/bussiness/projections/user-xp/user-xp-projection.service"
import type {
    UserXpResult,
} from "@modules/bussiness/projections/user-xp/types"
import {
    UserXpResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Public profile query: a user's XP aggregate -- the per-source XP figures
 * (challenge / milestone / coding / lesson) summed from the `xp_histories` ledger
 * plus the total-XP and spendable Coin balances. Thin read off the
 * per-user CQRS XP projection (the heavy GROUP BY runs in recompute, not per
 * request). Optional auth; a locked profile is withheld by
 * {@link GraphQLProfileVisibilityGuard}.
 */
export class UserXpResolver {
    constructor(
        private readonly userXpProjectionService: UserXpProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "User XP fetched successfully",
        [Locale.Vi]: "Lấy điểm kinh nghiệm thành công", // vn-ok: vi-locale string emitted to clients
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
