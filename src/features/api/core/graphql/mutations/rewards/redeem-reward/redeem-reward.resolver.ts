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
    RewardsService,
} from "@modules/bussiness"
import {
    RedeemRewardData,
    RedeemRewardRequest,
    RedeemRewardResponse,
} from "./graphql-types"

/**
 * Redeem a reward from the gifts store for the authenticated user. Delegates the
 * balance check + effect + ledger insert to {@link RewardsService} (one atomic
 * transaction; `user.points` is never debited — the spendable balance is derived).
 * A typed exception surfaces when the key is unknown, the balance is short, or the
 * streak-freeze cap is reached.
 */
@Resolver()
export class RedeemRewardResolver {
    constructor(
        private readonly rewardsService: RewardsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reward redeemed successfully",
        [Locale.Vi]: "Đổi quà thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RedeemRewardResponse,
        {
            name: "redeemReward",
            description: "Redeem a reward from the gifts store (spends điểm quà).",
        },
    )
    async execute(
        @Args("request")
            request: RedeemRewardRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<RedeemRewardData> {
        return this.rewardsService.redeem(user.id,
            request.rewardKey,
            {
                recipientName: request.recipientName,
                phone: request.phone,
                address: request.address,
            })
    }
}
