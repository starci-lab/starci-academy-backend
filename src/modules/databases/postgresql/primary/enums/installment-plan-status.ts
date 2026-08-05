import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Lifecycle status of an {@link import("../entities/installment-plan.entity").InstallmentPlanEntity},
 * driven by the daily enforcement cron (mirrors `MembershipEntity`'s
 * Active/Expired lifecycle, plus an `Overdue` warning stage and a `Defaulted`
 * lockout stage before that).
 */
export enum InstallmentPlanStatus {
    /** Current cycle not yet due, or just paid on time. */
    Active = "active",
    /** Past `nextDueAt`, within the grace period -- reminders sent, access still granted. */
    Overdue = "overdue",
    /** Past the full grace period without reaching the cycle's minimum payment -- enrollment(s) locked. */
    Defaulted = "defaulted",
    /** Fixed: every installment paid. FlexiblePool: `remainingVnd` reached zero. */
    Completed = "completed",
}

export const GraphQLTypeInstallmentPlanStatus = createEnumType(
    InstallmentPlanStatus,
)

registerEnumType(
    GraphQLTypeInstallmentPlanStatus,
    {
        name: "InstallmentPlanStatus",
        description: "Lifecycle status of an installment plan.",
        valuesMap: {
            [InstallmentPlanStatus.Active]: {
                description: "Current cycle not yet due, or just paid on time.",
            },
            [InstallmentPlanStatus.Overdue]: {
                description: "Past due, within the grace period — reminded, still granted access.",
            },
            [InstallmentPlanStatus.Defaulted]: {
                description: "Past the full grace period unpaid — enrollment(s) locked.",
            },
            [InstallmentPlanStatus.Completed]: {
                description: "Fully paid off.",
            },
        },
    },
)
