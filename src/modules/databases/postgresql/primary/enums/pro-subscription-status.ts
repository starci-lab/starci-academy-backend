import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/** Lifecycle of the dedicated StarCi Pro learner subscription. */
export enum ProSubscriptionStatus {
    /** Selecting active grants access until the paid period end. */
    Active = "active",
    /** Selecting cancelled keeps access but prevents renewal after period end. */
    CancelledAtPeriodEnd = "cancelledAtPeriodEnd",
    /** Selecting expired revokes all rights sourced from this aggregate. */
    Expired = "expired",
}

export const GraphQLTypeProSubscriptionStatus = createEnumType(ProSubscriptionStatus)

registerEnumType(
    GraphQLTypeProSubscriptionStatus,
    {
        name: "ProSubscriptionStatus",
        description: "Lifecycle of a StarCi Pro learner subscription.",
    },
)
