import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Lifecycle status of a {@link AiSubTier} subscription.
 */
export enum AiSubStatus {
    /** Subscription is paid and within currentPeriodEnd. */
    Active = "active",
    /** User cancelled -- autoRenew off; still active until period end if cancelled at-period-end. */
    Cancelled = "cancelled",
    /** Past currentPeriodEnd, not renewed. */
    Expired = "expired",
}

export const GraphQLTypeAiSubStatus = createEnumType(AiSubStatus)

registerEnumType(
    GraphQLTypeAiSubStatus,
    {
        name: "AiSubStatus",
        description: "Lifecycle status of an AI subscription.",
        valuesMap: {
            [AiSubStatus.Active]: {
                description: "Paid and active.",
            },
            [AiSubStatus.Cancelled]: {
                description: "Cancelled by user; autoRenew off.",
            },
            [AiSubStatus.Expired]: {
                description: "Past period end without renewal.",
            },
        },
    },
)
