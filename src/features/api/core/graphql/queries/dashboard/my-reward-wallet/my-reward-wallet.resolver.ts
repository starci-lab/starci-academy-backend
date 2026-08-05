import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
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
    MyRewardWalletData,
} from "./graphql-types"
import {
    MyRewardWalletResponse,
} from "./graphql-types"

@Resolver()
/**
 * The authenticated viewer's reward wallet: spendable Coin balance (derived
 * from lifetime points minus what they've spent — never touching the leaderboard
 * score), plus their redemption history with localized titles.
 */
export class MyRewardWalletResolver {
    constructor(
        private readonly rewardsService: RewardsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reward wallet fetched successfully",
        [Locale.Vi]: "Lấy ví Coin thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyRewardWalletResponse,
        {
            name: "myRewardWallet",
            description: "The viewer's spendable Coin balance + redemption history.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<MyRewardWalletData> {
        const wallet = await this.rewardsService.getWallet(user.id)
        return {
            balance: wallet.balance,
            spent: wallet.spent,
            // resolve each stored key to its localized catalog title for display
            redemptions: wallet.redemptions.map((redemption) => ({
                rewardKey: redemption.rewardKey,
                title: this.rewardsService.titleFor(redemption.rewardKey,
                    locale),
                cost: redemption.cost,
                status: redemption.status,
                createdAt: redemption.createdAt,
            })),
        }
    }
}
