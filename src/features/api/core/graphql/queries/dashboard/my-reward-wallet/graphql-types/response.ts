import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One past redemption in the viewer's reward wallet.
 */
@ObjectType({
    description: "A past reward redemption.",
})
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
            description: "Điểm quà paid for this redemption.",
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

/**
 * The viewer's reward wallet: spendable balance, lifetime spent, and history.
 */
@ObjectType({
    description: "The viewer's điểm quà wallet.",
})
export class MyRewardWalletData {
    @Field(
        () => Int,
        {
            description: "Current spendable điểm quà balance (= points - spent).",
        },
    )
        balance: number

    @Field(
        () => Int,
        {
            description: "Lifetime điểm quà spent (non-cancelled redemptions).",
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

/**
 * Response wrapper for the myRewardWallet query.
 */
@ObjectType({
    description: "Response wrapper for the myRewardWallet query.",
})
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
