import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * How an {@link import("../entities/installment-plan.entity").InstallmentPlanEntity}'s
 * per-cycle minimum payment is computed:
 * - `Fixed` -- a NEW purchase paying in installments (3/6/12-month schedule, a
 *   markup snapshot applied at checkout). Minimum = the fixed `monthlyAmountVnd`.
 * - `FlexiblePool` -- a legacy Pioneer arrears balance migrated into the system
 *   (no schedule, no markup -- the original price is honoured). Minimum =
 *   `max(remainingVnd * minPaymentPercent, minPaymentFloorVnd)`, recomputed
 *   every cycle against the CURRENT remaining balance.
 */
export enum InstallmentPlanType {
    /** New purchase: every cycle's minimum is the locked `monthlyAmountVnd` (markup snapshotted at checkout). */
    Fixed = "fixed",
    /** Legacy Pioneer arrears: minimum is recomputed each cycle from remaining balance -- no markup, no schedule. */
    FlexiblePool = "flexible_pool",
}

export const GraphQLTypeInstallmentPlanType = createEnumType(
    InstallmentPlanType,
)

registerEnumType(
    GraphQLTypeInstallmentPlanType,
    {
        name: "InstallmentPlanType",
        description: "How an installment plan's per-cycle minimum payment is computed.",
        valuesMap: {
            [InstallmentPlanType.Fixed]: {
                description: "Fixed N-month schedule (new purchase) with a markup snapshot.",
            },
            [InstallmentPlanType.FlexiblePool]: {
                description: "Flexible arrears pool (legacy Pioneer debt), no markup, no fixed schedule.",
            },
        },
    },
)
