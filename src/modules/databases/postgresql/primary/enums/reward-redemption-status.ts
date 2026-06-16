import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Lifecycle status of a reward redemption row. Digital rewards (e.g. a streak
 * freeze) are `granted` immediately on redeem; physical rewards (sticker,
 * t-shirt) start as `pending` until ops fulfils them. A `cancelled` row is
 * excluded from the spent-points total so the user's balance is refunded.
 */
export enum RewardRedemptionStatus {
    /** Digital reward delivered instantly on redeem (effect already applied). */
    Granted = "granted",
    /** Physical reward awaiting ops fulfilment (shipping). */
    Pending = "pending",
    /** Physical reward shipped / fulfilled by ops. */
    Fulfilled = "fulfilled",
    /** Redemption voided — its cost no longer counts against the balance. */
    Cancelled = "cancelled",
}

export const GraphQLTypeRewardRedemptionStatus = createEnumType(RewardRedemptionStatus)

/**
 * Register the reward-redemption status enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeRewardRedemptionStatus,
    {
        name: "RewardRedemptionStatus",
        description: "Lifecycle status of a reward redemption row.",
        valuesMap: {
            [RewardRedemptionStatus.Granted]: {
                description: "Digital reward delivered instantly on redeem.",
            },
            [RewardRedemptionStatus.Pending]: {
                description: "Physical reward awaiting ops fulfilment.",
            },
            [RewardRedemptionStatus.Fulfilled]: {
                description: "Physical reward shipped / fulfilled by ops.",
            },
            [RewardRedemptionStatus.Cancelled]: {
                description: "Redemption voided — cost no longer counts against the balance.",
            },
        },
    },
)
