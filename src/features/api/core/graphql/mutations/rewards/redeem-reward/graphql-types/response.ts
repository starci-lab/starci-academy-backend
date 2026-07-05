import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** The AI-credit bonus granted by redeeming an `aiCredit`-kind reward. */
@ObjectType({
    description: "Bonus AI credit granted for the current 5h + weekly window.",
})
export class RedeemRewardAiCreditGrant {
    @Field(
        () => Int,
        {
            description: "Bonus credit added to the current 5h window.",
        },
    )
        amount5h: number

    @Field(
        () => Int,
        {
            description: "Bonus credit added to the current weekly window.",
        },
    )
        amountWeek: number
}

/**
 * The refreshed wallet + inventory after a redemption.
 */
@ObjectType({
    description: "Refreshed Coin balance + streak-freeze count after redeeming.",
})
export class RedeemRewardData {
    @Field(
        () => Int,
        {
            description: "The viewer's remaining Coin balance after the redemption.",
        },
    )
        balance: number

    @Field(
        () => Int,
        {
            description: "The viewer's streak-freeze count after the redemption.",
        },
    )
        streakFreezes: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "The freshly-minted voucher code, when redeeming a `voucher`-kind reward.",
        },
    )
        voucherCode?: string

    @Field(
        () => RedeemRewardAiCreditGrant,
        {
            nullable: true,
            description: "The bonus credit granted, when redeeming an `aiCredit`-kind reward.",
        },
    )
        aiCreditGranted?: RedeemRewardAiCreditGrant
}

/**
 * Response wrapper for the redeemReward mutation.
 */
@ObjectType({
    description: "Response wrapper for the redeemReward mutation.",
})
export class RedeemRewardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RedeemRewardData> {
    @Field(
        () => RedeemRewardData,
        {
            nullable: true,
            description: "Refreshed balance + streak-freeze count.",
        },
    )
        data: RedeemRewardData
}
