import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A past reward redemption.",
})
/**
 * One past redemption in the viewer's reward wallet.
 */
export class RewardWalletRedemptionObject {
    @Field(
        () => String,
        {
            description: "Key of the redeemed reward.",
        },
    )
        rewardKey: string

    @Field(
        () => String,
        {
            description: "Display title of the reward (localized).",
        },
    )
        title: string

    @Field(
        () => Int,
        {
            description: "Reward points paid for this redemption.",
        },
    )
        cost: number

    @Field(
        () => String,
        {
            description: "Fulfilment status — granted / pending / fulfilled / cancelled.",
        },
    )
        status: string

    @Field(
        () => Date,
        {
            description: "When the redemption was created.",
        },
    )
        createdAt: Date
}

@ObjectType({
    description: "The viewer's Coin wallet.",
})
/**
 * The viewer's reward wallet: spendable balance, lifetime spent, and history.
 */
export class MyRewardWalletData {
    @Field(
        () => Int,
        {
            description: "Current spendable Coin balance (= coin - spent).",
        },
    )
        balance: number

    @Field(
        () => Int,
        {
            description: "Lifetime Coin spent (non-cancelled redemptions).",
        },
    )
        spent: number

    @Field(
        () => [RewardWalletRedemptionObject],
        {
            description: "Past redemptions, newest first.",
        },
    )
        redemptions: Array<RewardWalletRedemptionObject>
}

@ObjectType({
    description: "Response wrapper for the myRewardWallet query.",
})
/**
 * Response wrapper for the myRewardWallet query.
 */
export class MyRewardWalletResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyRewardWalletData> {
    @Field(
        () => MyRewardWalletData,
        {
            nullable: true,
            description: "The viewer's reward wallet.",
        },
    )
        data: MyRewardWalletData
}
