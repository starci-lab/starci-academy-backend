import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/**
 * Why a loyalty discount was applied to a course price. Drives the FE copy
 * next to the discounted price (bundle vs diligent vs both vs none).
 */
export enum DiscountReason {
    /** No discount applies. */
    None = "none",
    /** Discount earned only from courses the user already owns (bundle/loyalty). */
    EnrolledCount = "enrolledCount",
    /** Discount earned only from being diligent (streak / total points). */
    Diligent = "diligent",
    /** Both the enrolled-count bonus and the diligent bonus apply. */
    Both = "both",
}

/**
 * GraphQL type for the discount reason enum.
 */
export const GraphQLTypeDiscountReason = createEnumType(
    DiscountReason,
)

/**
 * Register the discount reason enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeDiscountReason,
    {
        name: "DiscountReason",
        description: "Why a loyalty discount was applied to a course price.",
        valuesMap: {
            [DiscountReason.None]: {
                description: "No loyalty discount applies.",
            },
            [DiscountReason.EnrolledCount]: {
                description: "Discount from courses the user already owns (bundle/loyalty).",
            },
            [DiscountReason.Diligent]: {
                description: "Discount from being diligent (streak >= 7 or total points >= 1000).",
            },
            [DiscountReason.Both]: {
                description: "Both the enrolled-count and the diligent bonus apply.",
            },
        },
    },
)
