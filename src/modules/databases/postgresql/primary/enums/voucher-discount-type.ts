import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * How a {@link CourseVoucherEntity} discounts a course price: a percent off
 * the checkout price, or a flat VND amount off.
 */
export enum VoucherDiscountType {
    /** Percent off (0-100), applied on top of the loyalty-discounted price. */
    Percent = "percent",
    /** Flat VND amount off, subtracted from the loyalty-discounted price. */
    Flat = "flat",
}

/**
 * GraphQL type for the voucher discount type enum.
 */
export const GraphQLTypeVoucherDiscountType = createEnumType(
    VoucherDiscountType,
)

/**
 * Register the voucher discount type enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeVoucherDiscountType,
    {
        name: "VoucherDiscountType",
        description: "How a voucher discounts a course price.",
        valuesMap: {
            [VoucherDiscountType.Percent]: {
                description: "Percent off (0-100).",
            },
            [VoucherDiscountType.Flat]: {
                description: "Flat VND amount off.",
            },
        },
    },
)
