import type {
    EntityManager,
} from "typeorm"
import type {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"

/**
 * One offered `Fixed`-plan term for a given base price -- the shape the price
 * preview surfaces so the payment modal can show "N months - X/month - total (+markup%)"
 * before checkout.
 */
export interface InstallmentOption {
    /** Number of monthly cycles (3, 6, or 12). */
    months: number
    /** Markup percent this term adds over the base price. */
    markupPercent: number
    /** Base price x (1 + markup%), rounded -- the whole amount owed across the schedule. */
    totalAmountVnd: number
    /** `totalAmountVnd / months`, rounded -- the amount charged each cycle (incl. the first at checkout). */
    monthlyAmountVnd: number
}

/** Params for {@link import("../installment-plan.service").InstallmentPlanService.createFixedPlan}. */
export interface CreateFixedInstallmentPlanParams {
    /** The buyer. */
    userId: string
    /** The checkout transaction that funded the first cycle. */
    originTransactionId: string
    /** Every course this plan gates access to (locked/unlocked together). */
    lockedCourseIds: Array<string>
    /** Total amount owed across the whole schedule, markup already applied. */
    totalAmountVnd: number
    /** Number of months in the schedule (3, 6, or 12). */
    months: number
    /** Markup percent snapshot applied at checkout. */
    markupPercent: number
    /** Active transaction, when called inside one (e.g. from the reconcile worker). */
    entityManager?: EntityManager
}

/** Params for {@link import("../installment-plan.service").InstallmentPlanService.createFlexiblePoolPlan}. */
export interface CreateFlexiblePoolInstallmentPlanParams {
    /** The learner this legacy arrears balance belongs to. */
    userId: string
    /** Every course this plan gates access to (locked/unlocked together). */
    lockedCourseIds: Array<string>
    /** The REAL remaining arrears balance (backfill input, per-learner). */
    remainingVnd: number
    /** Percent of the current balance owed each cycle. Defaults to 10 (2026-07-05 decision). */
    minPaymentPercent?: number
    /** Absolute floor for the per-cycle minimum. Defaults to 500,000đ (2026-07-05 decision). */ // vn-ok: VND currency suffix the product displays
    minPaymentFloorVnd?: number
    /** When the first cycle under the new system is due. */
    nextDueAt: Date
    /** Active transaction, when called inside one (e.g. from the backfill script). */
    entityManager?: EntityManager
}

/** Params for {@link import("../installment-plan.service").InstallmentPlanService.recordPayment}. */
export interface RecordInstallmentPaymentParams {
    /** The plan being paid against. */
    planId: string
    /** The REAL amount just paid (may exceed the cycle's minimum -- always allowed). */
    paidAmountVnd: number
    /** Active transaction, when called inside one (e.g. from the reconcile worker). */
    entityManager?: EntityManager
}

/** Result of {@link import("../installment-plan.service").InstallmentPlanService.recordPayment}. */
export interface RecordInstallmentPaymentResult {
    /** The plan after applying the payment. */
    plan: InstallmentPlanEntity
    /** Whether the paid amount met (or exceeded) this cycle's minimum -- false leaves the plan `Overdue`. */
    metMinimum: boolean
    /** Whether this payment finished the plan (`Fixed`: every installment paid; `FlexiblePool`: balance reached zero). */
    completed: boolean
}

/** Params for {@link import("../installment-plan.service").InstallmentPlanService.applyPaymentForTransaction}. */
export interface ApplyInstallmentPaymentForTransactionParams {
    /** The succeeded `installmentPayment` transaction funding this cycle. */
    transactionId: string
    /** The plan this transaction pays a cycle of ({@link TransactionEntity.installmentPlanId}). */
    planId: string
    /** The amount actually charged ({@link TransactionEntity.amount}). */
    paidAmountVnd: number
    /** Active transaction, when called inside one (e.g. from the reconcile worker). */
    entityManager?: EntityManager
}
