import {
    Injectable,
} from "@nestjs/common"
import {
    In,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    InstallmentPlanEntity,
    InstallmentPlanStatus,
    InstallmentPlanType,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    DayjsService,
} from "@modules/mixin"
import type {
    ApplyInstallmentPaymentForTransactionParams,
    CreateFixedInstallmentPlanParams,
    CreateFlexiblePoolInstallmentPlanParams,
    RecordInstallmentPaymentParams,
    RecordInstallmentPaymentResult,
} from "./types"

/** Default arrears-pool minimum-payment percent (2026-07-05 decision). */
const DEFAULT_MIN_PAYMENT_PERCENT = 10
/** Default arrears-pool minimum-payment absolute floor, VND (2026-07-05 decision). */
const DEFAULT_MIN_PAYMENT_FLOOR_VND = 500_000

/**
 * Owns installment-plan lifecycle: creating a plan at checkout (`Fixed`) or at
 * backfill time (`FlexiblePool`), computing each cycle's minimum payment, and
 * applying a payment. Locking/unlocking the gated enrollments on
 * default/catch-up is driven by {@link InstallmentPlanEnforcementCronService}
 * (the sweep) and this service (the immediate unlock-on-catch-up path) sharing
 * the same `lockedCourseIds` snapshot on the plan.
 */
@Injectable()
export class InstallmentPlanService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) { }

    /**
     * The minimum amount owed THIS cycle:
     * - `Fixed` — the fixed `monthlyAmountVnd` snapshot (never changes).
     * - `FlexiblePool` — `max(remainingVnd * minPaymentPercent%, minPaymentFloorVnd)`,
     *   recomputed against the CURRENT balance every cycle (shrinks as the
     *   pool shrinks, but never below the floor).
     *
     * @param plan - The plan (or a projection carrying the fields this needs).
     * @returns The minimum payment for the current cycle, in VND.
     */
    computeMinPaymentVnd(
        plan: Pick<InstallmentPlanEntity, "planType" | "monthlyAmountVnd" | "remainingVnd" | "minPaymentPercent" | "minPaymentFloorVnd">,
    ): number {
        if (plan.planType === InstallmentPlanType.Fixed) {
            return plan.monthlyAmountVnd ?? 0
        }
        const remaining = plan.remainingVnd ?? 0
        const percentOfRemaining = Math.ceil(remaining * (plan.minPaymentPercent / 100))
        return Math.max(percentOfRemaining,
            plan.minPaymentFloorVnd)
    }

    /**
     * Create a `Fixed` plan for a NEW purchase paying in installments — called
     * right after the first cycle's payment is confirmed (mirrors
     * `MembershipService.grantMembership`'s "grant on success" shape).
     * `installmentsPaid` starts at 1 (the cycle just charged at checkout).
     *
     * @param params - {@link CreateFixedInstallmentPlanParams}.
     * @returns The created plan.
     */
    async createFixedPlan(
        {
            userId,
            originTransactionId,
            lockedCourseIds,
            totalAmountVnd,
            months,
            markupPercent,
            entityManager,
        }: CreateFixedInstallmentPlanParams,
    ): Promise<InstallmentPlanEntity> {
        const manager = entityManager ?? this.entityManager
        // remainder folded into the last cycle by rounding UP every cycle except
        // the last is out of scope for v1 — a plain even split is good enough
        // (any leftover cent-equivalent is negligible at VND granularity)
        const monthlyAmountVnd = Math.round(totalAmountVnd / months)
        const plan = manager.create(
            InstallmentPlanEntity,
            {
                user: {
                    id: userId,
                },
                originTransaction: {
                    id: originTransactionId,
                },
                lockedCourseIds,
                planType: InstallmentPlanType.Fixed,
                status: InstallmentPlanStatus.Active,
                months,
                monthlyAmountVnd,
                totalAmountVnd,
                markupPercent,
                installmentsPaid: 1,
                nextDueAt: this.dayjsService.now().add(1,
                    "month").toDate(),
            },
        )
        return manager.save(plan)
    }

    /**
     * Create a `FlexiblePool` plan from a legacy Pioneer arrears balance — used
     * by the one-off backfill script (§2.5 of `docs/installment-payment-plan.md`).
     * The original price is honoured (no markup): `remainingVnd` is the REAL
     * balance the learner already owes, not a fresh purchase.
     *
     * @param params - {@link CreateFlexiblePoolInstallmentPlanParams}.
     * @returns The created plan.
     */
    async createFlexiblePoolPlan(
        {
            userId,
            lockedCourseIds,
            remainingVnd,
            minPaymentPercent = DEFAULT_MIN_PAYMENT_PERCENT,
            minPaymentFloorVnd = DEFAULT_MIN_PAYMENT_FLOOR_VND,
            nextDueAt,
            entityManager,
        }: CreateFlexiblePoolInstallmentPlanParams,
    ): Promise<InstallmentPlanEntity> {
        const manager = entityManager ?? this.entityManager
        const plan = manager.create(
            InstallmentPlanEntity,
            {
                user: {
                    id: userId,
                },
                originTransaction: null,
                lockedCourseIds,
                planType: InstallmentPlanType.FlexiblePool,
                status: InstallmentPlanStatus.Active,
                remainingVnd,
                minPaymentPercent,
                minPaymentFloorVnd,
                nextDueAt,
            },
        )
        return manager.save(plan)
    }

    /**
     * Apply a payment to a plan (§2.4 of the design doc): a `Fixed` plan
     * advances one cycle and always meets its fixed minimum by definition; a
     * `FlexiblePool` plan deducts the REAL amount paid from `remainingVnd` and
     * only advances the cycle (clears the overdue reminders + relocks the next
     * `nextDueAt`) once the payment reaches THIS cycle's minimum — paying
     * under the minimum still reduces the balance but leaves the plan
     * `Overdue` until topped up. Paying MORE than the minimum is always
     * allowed (encouraged for `FlexiblePool` — it shrinks next cycle's
     * percentage-based minimum too).
     *
     * @param params - {@link RecordInstallmentPaymentParams}.
     * @returns {@link RecordInstallmentPaymentResult}.
     */
    async recordPayment(
        {
            planId,
            paidAmountVnd,
            entityManager,
        }: RecordInstallmentPaymentParams,
    ): Promise<RecordInstallmentPaymentResult> {
        const manager = entityManager ?? this.entityManager
        const plan = await manager.findOneByOrFail(
            InstallmentPlanEntity,
            {
                id: planId,
            },
        )
        const wasDefaulted = plan.status === InstallmentPlanStatus.Defaulted
        const minPaymentVnd = this.computeMinPaymentVnd(plan)
        const metMinimum = paidAmountVnd >= minPaymentVnd

        if (plan.planType === InstallmentPlanType.Fixed) {
            plan.installmentsPaid += 1
            const completed = plan.months !== null && plan.installmentsPaid >= plan.months
            plan.status = completed ? InstallmentPlanStatus.Completed : InstallmentPlanStatus.Active
            plan.nextDueAt = this.dayjsService.now().add(1,
                "month").toDate()
            plan.dueRemindedAt = null
            plan.secondRemindedAt = null
            await manager.save(plan)
            // Fixed always meets its own fixed minimum → any payment catches it up,
            // so a previously-locked plan is unlocked here too
            if (wasDefaulted) {
                await this.unlockGatedEnrollments(plan,
                    manager)
            }
            return {
                plan,
                metMinimum: true,
                completed,
            }
        }

        // FlexiblePool — deduct the real amount paid, never below zero
        plan.remainingVnd = Math.max((plan.remainingVnd ?? 0) - paidAmountVnd,
            0)
        const completed = plan.remainingVnd <= 0
        if (completed) {
            plan.status = InstallmentPlanStatus.Completed
        } else if (metMinimum) {
            // caught up for this cycle — advance to the next one, clear warnings
            plan.status = InstallmentPlanStatus.Active
            plan.nextDueAt = this.dayjsService.now().add(1,
                "month").toDate()
            plan.dueRemindedAt = null
            plan.secondRemindedAt = null
        }
        // else: paid something but still under this cycle's minimum — balance
        // drops, but `nextDueAt`/status are left as-is (still Overdue/Defaulted
        // until they top up to the minimum)
        await manager.save(plan)
        if (wasDefaulted && (completed || metMinimum)) {
            await this.unlockGatedEnrollments(plan,
                manager)
        }
        return {
            plan,
            metMinimum,
            completed,
        }
    }

    /**
     * Apply a succeeded `installmentPayment` transaction to its plan and mark
     * the transaction succeeded — both inside one DB transaction, mirroring
     * `AiEntitlementService.grantTier`'s idempotency shape. Called by
     * `ReconcileTransactionWorker.finalize()` on gateway confirmation. A
     * transaction already marked succeeded is left untouched (safe against
     * webhook + reconcile-poll double-firing).
     *
     * @param params - {@link ApplyInstallmentPaymentForTransactionParams}.
     * @returns Whether this call newly applied the payment (false = already applied).
     */
    async applyPaymentForTransaction(
        {
            transactionId,
            planId,
            paidAmountVnd,
            entityManager,
        }: ApplyInstallmentPaymentForTransactionParams,
    ): Promise<boolean> {
        const manager = entityManager ?? this.entityManager
        return manager.transaction(
            async (transactionalManager): Promise<boolean> => {
                // idempotency guard — skip if this payment was already applied
                const transaction = await transactionalManager.findOne(
                    TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    },
                )
                if (transaction?.status === TransactionStatus.Succeeded) {
                    return false
                }

                await this.recordPayment(
                    {
                        planId,
                        paidAmountVnd,
                        entityManager: transactionalManager,
                    },
                )

                await transactionalManager.update(
                    TransactionEntity,
                    {
                        id: transactionId,
                    },
                    {
                        status: TransactionStatus.Succeeded,
                    },
                )
                return true
            },
        )
    }

    /**
     * Lock every enrollment {@link InstallmentPlanEntity.lockedCourseIds}
     * snapshots (`is_enrolled = false`) — called by the enforcement cron the
     * moment a plan defaults. No-op for a legacy plan with an empty snapshot
     * (should never happen post-backfill, but never let a locking bug throw).
     *
     * @param plan - The plan whose gated courses should be locked.
     * @param entityManager - Active transaction, when called inside one.
     */
    async lockGatedEnrollments(
        plan: Pick<InstallmentPlanEntity, "userId" | "lockedCourseIds">,
        entityManager?: EntityManager,
    ): Promise<void> {
        if (plan.lockedCourseIds.length === 0) {
            return
        }
        const manager = entityManager ?? this.entityManager
        await manager.update(
            EnrollmentEntity,
            {
                user: {
                    id: plan.userId,
                },
                course: {
                    id: In(plan.lockedCourseIds),
                },
            },
            {
                isEnrolled: false,
            },
        )
    }

    /**
     * Restore every enrollment {@link InstallmentPlanEntity.lockedCourseIds}
     * snapshots (`is_enrolled = true`) — called the moment a defaulted plan
     * catches up (see {@link recordPayment}).
     *
     * @param plan - The plan whose gated courses should be unlocked.
     * @param entityManager - Active transaction, when called inside one.
     */
    async unlockGatedEnrollments(
        plan: Pick<InstallmentPlanEntity, "userId" | "lockedCourseIds">,
        entityManager?: EntityManager,
    ): Promise<void> {
        if (plan.lockedCourseIds.length === 0) {
            return
        }
        const manager = entityManager ?? this.entityManager
        await manager.update(
            EnrollmentEntity,
            {
                user: {
                    id: plan.userId,
                },
                course: {
                    id: In(plan.lockedCourseIds),
                },
            },
            {
                isEnrolled: true,
            },
        )
    }
}
