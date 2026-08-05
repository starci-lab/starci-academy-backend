import {
    Mutation,
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
    WeeklyChallengeService,
} from "@modules/bussiness/weekly-challenge/weekly-challenge.service"
import {
    ClaimWeeklyChallengeRewardData,
    ClaimWeeklyChallengeRewardResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Claim the authenticated user's Coin reward for passing the current ISO
 * week's featured challenge. Delegates the pass + already-claimed checks and
 * the reward grant to {@link WeeklyChallengeService} (one atomic transaction).
 * A typed exception surfaces when the challenge hasn't been passed yet or was
 * already claimed this week.
 */
export class ClaimWeeklyChallengeRewardResolver {
    constructor(
        private readonly weeklyChallengeService: WeeklyChallengeService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Weekly-challenge reward claimed successfully",
        [Locale.Vi]: "Nhận thưởng thử thách tuần thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ClaimWeeklyChallengeRewardResponse,
        {
            name: "claimWeeklyChallengeReward",
            description: "Claim the current user's coin reward for the passed weekly challenge.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ClaimWeeklyChallengeRewardData> {
        return this.weeklyChallengeService.claimReward(user.id)
    }
}
