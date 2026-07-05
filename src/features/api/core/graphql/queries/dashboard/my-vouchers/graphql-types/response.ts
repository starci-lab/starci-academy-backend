import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    GraphQLTypeVoucherDiscountType,
    GraphQLTypeVoucherStatus,
    VoucherDiscountType,
    VoucherStatus,
} from "@modules/databases"

/**
 * One voucher minted for the viewer by redeeming a `kind: "voucher"` Coin-shop
 * reward.
 */
@ObjectType({
    description: "A Coin-shop voucher owned by the viewer.",
})
export class MyVoucherObject {
    @Field(
        () => ID,
        {
            description: "The voucher row id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "The redeemable code (submit this at checkout).",
        },
    )
        code: string

    @Field(
        () => GraphQLTypeVoucherDiscountType,
        {
            description: "Percent-off or flat-VND-off.",
        },
    )
        discountType: VoucherDiscountType

    @Field(
        () => Int,
        {
            description: "Percent (0-100) or flat VND amount, per discountType.",
        },
    )
        value: number

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Course this voucher discounts; null = redeemable against any course.",
        },
    )
        courseId: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Title of the scoped course; null = any course.",
        },
    )
        courseTitle: string | null

    @Field(
        () => GraphQLTypeVoucherStatus,
        {
            description: "Lifecycle status — a stale `unused` past its expiresAt is surfaced as `expired`.",
        },
    )
        status: VoucherStatus

    @Field(
        () => Date,
        {
            description: "When the voucher stops being redeemable.",
        },
    )
        expiresAt: Date

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the voucher was spent; null until used.",
        },
    )
        usedAt: Date | null

    @Field(
        () => Date,
        {
            description: "When the voucher was minted.",
        },
    )
        createdAt: Date
}

/**
 * Response wrapper for the myVouchers query.
 */
@ObjectType({
    description: "Response wrapper for the myVouchers query.",
})
export class MyVouchersResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MyVoucherObject>> {
    @Field(
        () => [MyVoucherObject],
        {
            nullable: true,
            description: "The viewer's vouchers, newest first.",
        },
    )
        data: Array<MyVoucherObject>
}
