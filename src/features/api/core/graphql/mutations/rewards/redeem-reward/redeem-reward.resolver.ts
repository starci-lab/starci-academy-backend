import {
    Args,
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
    RewardsService,
} from "@modules/bussiness/rewards/rewards.service"
import {
    RedeemRewardRequest,
} from "./graphql-types/request"
import {
    RedeemRewardData,
    RedeemRewardResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Redeem a reward from the Coin shop for the authenticated user. Delegates the
 * balance check + effect + ledger insert to {@link RewardsService} (one atomic
 * transaction; `user.coin_balance` is never debited -- the spendable balance is derived).
 * A typed exception surfaces when the key is unknown, the balance is short, or the
 * streak-freeze cap is reached.
 */
export class RedeemRewardResolver {
    constructor(
        private readonly rewardsService: RewardsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reward redeemed successfully",
        [Locale.Vi]: "Đổi quà thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RedeemRewardResponse,
        {
            name: "redeemReward",
            description: "Redeem a reward from the Coin shop (spends Coin).",
        },
    )
    async execute(
        @Args("request")
            request: RedeemRewardRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<RedeemRewardData> {
        return this.rewardsService.redeem({
            userId: user.id,
            rewardKey: request.rewardKey,
            shipping: {
                recipientName: request.recipientName,
                phone: request.phone,
                address: request.address,
            },
        })
    }
}
