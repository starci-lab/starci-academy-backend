import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Lifecycle status of a {@link CourseVoucherEntity} minted from the Coin shop.
 * `reserved` is the in-flight state between "a pending checkout claimed this
 * code" and "the payment actually succeeded" — it prevents a second checkout
 * from spending the same code while the first is still awaiting its gateway
 * webhook, without burning the code if that first checkout fails/expires.
 */
export enum VoucherStatus {
    /** Minted, not yet applied to any checkout. */
    Unused = "unused",
    /** Claimed by a pending (not-yet-confirmed) checkout. */
    Reserved = "reserved",
    /** Applied to a succeeded checkout — spent, cannot be reused. */
    Used = "used",
    /** Passed its `expires_at` without being used — inert. */
    Expired = "expired",
}

/**
 * GraphQL type for the voucher status enum.
 */
export const GraphQLTypeVoucherStatus = createEnumType(
    VoucherStatus,
)

/**
 * Register the voucher status enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeVoucherStatus,
    {
        name: "VoucherStatus",
        description: "Lifecycle status of a Coin-shop voucher.",
        valuesMap: {
            [VoucherStatus.Unused]: {
                description: "Minted, not yet applied to any checkout.",
            },
            [VoucherStatus.Reserved]: {
                description: "Claimed by a pending (not-yet-confirmed) checkout.",
            },
            [VoucherStatus.Used]: {
                description: "Applied to a succeeded checkout — spent.",
            },
            [VoucherStatus.Expired]: {
                description: "Passed its expiry without being used.",
            },
        },
    },
)
