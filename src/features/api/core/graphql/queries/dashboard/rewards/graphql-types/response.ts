import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    GraphQLTypeVoucherDiscountType,
} from "@modules/databases"

/** The discount a `voucher`-kind reward mints, so the FE can show it before redeeming. */
@ObjectType({
    description: "The discount a voucher-kind reward mints.",
})
export class RewardVoucherObject {
    @Field(
        () => GraphQLTypeVoucherDiscountType,
        {
            description: "Percent-off or flat-VND-off.",
        },
    )
        discountType: string

    @Field(
        () => Int,
        {
            description: "Percent (0-100) or flat VND amount.",
        },
    )
        value: number

    @Field(
        () => Int,
        {
            description: "Days the minted code stays redeemable after granting.",
        },
    )
        validityDays: number
}

/** The bonus AI credit an `aiCredit`-kind reward grants, for the current window. */
@ObjectType({
    description: "The bonus AI credit an aiCredit-kind reward grants.",
})
export class RewardAiCreditObject {
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
 * One redeemable reward in the Coin shop, localized to the request locale.
 */
@ObjectType({
    description: "A redeemable reward in the Coin shop.",
})
export class RewardObject {
    @Field(
        () => String,
        {
            description: "Stable reward key, used as the redeem identifier.",
        },
    )
        key: string

    @Field(
        () => String,
        {
            description: "Display title (localized).",
        },
    )
        title: string

    @Field(
        () => String,
        {
            description: "Short description of what the reward gives (localized).",
        },
    )
        description: string

    @Field(
        () => Int,
        {
            description: "Cost in Coin.",
        },
    )
        cost: number

    @Field(
        () => String,
        {
            description: "Reward kind — 'digital', 'physical', 'voucher', or 'aiCredit'.",
        },
    )
        kind: string

    @Field(
        () => RewardVoucherObject,
        {
            nullable: true,
            description: "Present only when kind === 'voucher'.",
        },
    )
        voucher?: RewardVoucherObject

    @Field(
        () => RewardAiCreditObject,
        {
            nullable: true,
            description: "Present only when kind === 'aiCredit'.",
        },
    )
        aiCredit?: RewardAiCreditObject
}

/**
 * Response wrapper for the rewards catalog query.
 */
@ObjectType({
    description: "Response wrapper for the rewards query.",
})
export class RewardsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<RewardObject>> {
    @Field(
        () => [RewardObject],
        {
            nullable: true,
            description: "The redeemable reward catalog.",
        },
    )
        data: Array<RewardObject>
}
