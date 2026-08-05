import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Lifecycle status of a community membership subscription.
 */
export enum MembershipStatus {
    /** The membership is paid and within its current billing period. */
    Active = "active",
    /** The user cancelled; access runs until {@link currentPeriodEnd} then expires. */
    Cancelled = "cancelled",
    /** The current billing period elapsed without renewal; access is revoked. */
    Expired = "expired",
}

/**
 * GraphQL type for the membership status enum.
 */
export const GraphQLTypeMembershipStatus = createEnumType(MembershipStatus)

/**
 * Register the membership status enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeMembershipStatus,
    {
        name: "MembershipStatus",
        description: "Lifecycle status of a community membership subscription.",
        valuesMap: {
            [MembershipStatus.Active]: {
                description: "The membership is paid and within its current billing period.",
            },
            [MembershipStatus.Cancelled]: {
                description: "The user cancelled; access runs until the period end then expires.",
            },
            [MembershipStatus.Expired]: {
                description: "The current billing period elapsed without renewal; access is revoked.",
            },
        },
    },
)
