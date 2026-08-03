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
    CartItemEntity,
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
import {
    envConfig,
} from "@modules/env"
import {
    InstallmentPlanNotFoundException,
} from "@modules/exceptions"
import type {
    ApplyInstallmentPaymentForTransactionParams,
    CreateFixedInstallmentPlanParams,
    CreateFlexiblePoolInstallmentPlanParams,
    InstallmentOption,
    RecordInstallmentPaymentParams,
    RecordInstallmentPaymentResult,
} from "./types"

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
     * The markup schedule → offered term options for a given base price
     * (loyalty/bundle-discounted, pre-markup). One entry per configured month
     * option, in ascending-month order. Returns `[]` when `baseVnd <= 0` (a free
     * course has no installment plan to offer).
     *
     * @param baseVnd - The discounted VND price installments are computed against.
     * @returns The offered {@link InstallmentOption}s (empty for a non-positive base).
     */
    computeInstallmentOptions(
        baseVnd: number,
    ): Array<InstallmentOption> {
        if (baseVnd <= 0) {
            return []
        }
        return Object.keys(envConfig().installment.markupPercentByMonths)
            .map((months) => this.computeInstallmentTotal(baseVnd,
                Number(months)))
            // ascending months so the modal renders 3 → 6 → 12 left-to-right
            .sort((left, right) => left.months - right.months)
    }

    /**
     * Resolve ONE term's markup/total/monthly for a base price — the single
     * source used by BOTH the price preview (all options) and checkout (the
     * chosen option), so the modal's shown numbers always equal what's charged.
     * A month with no configured markup falls back to 0% (charged = base).
     *
     * @param baseVnd - The discounted VND price installments are computed against.
     * @param months - The chosen term (must be a configured key to carry a markup).
     * @returns The resolved {@link InstallmentOption} for that term.
     */
    computeInstallmentTotal(
        baseVnd: number,
        months: number,
    ): InstallmentOption {
        const markupPercent = envConfig().installment.markupPercentByMonths[months] ?? 0
        const totalAmountVnd = Math.round(baseVnd * (1 + markupPercent / 100))
        return {
            months,
            markupPercent,
            totalAmountVnd,
            monthlyAmountVnd: Math.round(totalAmountVnd / months),
        }
    }

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
            minPaymentPercent = envConfig().installment.minPaymentPercent,
            minPaymentFloorVnd = envConfig().installment.minPaymentFloorVnd,
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
        // typed lookup, not `findOneByOrFail` — a raw TypeORM
        // `EntityNotFoundError` must never cross into the queue worker
        // (the reconcile worker calls this through
        // `applyPaymentForTransaction`), which needs a typed exception to
        // decide retryable-vs-not (see error-handling.md §3/§7)
        const plan = await manager.findOneBy(
            InstallmentPlanEntity,
            {
                id: planId,
            },
        )
        if (!plan) {
            throw new InstallmentPlanNotFoundException({
                planId,
            })
        }
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
     * `AiEntitlementService.grantTier`'s atomic-claim shape. Called by
     * `ReconcileTransactionWorker.finalize()` on gateway confirmation. The
     * Pending→Succeeded transition is claimed FIRST via a guarded
     * `UPDATE ... WHERE status = 'pending'` (same technique as
     * `TransactionActionService.updateTransactionStatusIfExpected`); the
     * NON-idempotent `recordPayment` (mutates installmentsPaid/remainingVnd)
     * only runs when THIS call is the one that won that claim (rows-affected =
     * 1), so a webhook + reconcile-poll double-fire cannot double-apply the
     * same payment to the ledger.
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
                // atomically claim the Pending -> Succeeded transition BEFORE
                // touching the plan's ledger — this IS the guard, replacing the
                // earlier read-then-compare-in-app-code (TOCTOU) idempotency check
                const claim = await transactionalManager.update(
                    TransactionEntity,
                    {
                        id: transactionId,
                        status: TransactionStatus.Pending,
                    },
                    {
                        status: TransactionStatus.Succeeded,
                    },
                )
                if (!claim.affected) {
                    // already claimed (applied) by a concurrent/earlier path → no-op
                    return false
                }

                // this call alone won the claim → apply the ledger mutation
                // exactly once for this funding transaction
                await this.recordPayment(
                    {
                        planId,
                        paidAmountVnd,
                        entityManager: transactionalManager,
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
        // mirror EnrollStepService: a course just (re-)enrolled must never linger
        // in the cart — the user could have added it back while it was locked
        await manager.delete(
            CartItemEntity,
            {
                user: {
                    id: plan.userId,
                },
                course: {
                    id: In(plan.lockedCourseIds),
                },
            },
        )
    }
}
