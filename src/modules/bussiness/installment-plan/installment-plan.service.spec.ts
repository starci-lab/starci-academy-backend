import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    InstallmentPlanService,
} from "./installment-plan.service"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    InstallmentPlanStatus,
} from "@modules/databases/postgresql/primary/enums/installment-plan-status"
import {
    InstallmentPlanType,
} from "@modules/databases/postgresql/primary/enums/installment-plan-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    InstallmentPlanNotFoundException,
} from "@modules/platform/exceptions/errors/payment/installment-plan-not-found"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * The mocked {@link EntityManagerMock} does not model `findOneBy` (a plain
 * `findOne` covers every other spec's needs) -- `recordPayment` is the first
 * caller, so this test file's manager is widened locally rather than growing
 * the shared mock for one caller.
 */
type ManagerMockWithFindOneBy = EntityManagerMock & {
    findOneBy: jest.Mock
}

/**
 * Build a plan row with `Fixed`-lane defaults; pass overrides to model a
 * `FlexiblePool` plan or a mid-schedule/defaulted state per test.
 */
const buildPlan = (
    overrides: Partial<InstallmentPlanEntity> = {
    },
): InstallmentPlanEntity => ({
    id: "plan-1",
    userId: "user-1",
    lockedCourseIds: [],
    planType: InstallmentPlanType.Fixed,
    status: InstallmentPlanStatus.Active,
    months: 6,
    monthlyAmountVnd: 500000,
    totalAmountVnd: 3000000,
    markupPercent: 5,
    installmentsPaid: 1,
    remainingVnd: null,
    minPaymentPercent: 10,
    minPaymentFloorVnd: 500000,
    nextDueAt: new Date("2026-01-01T00:00:00Z"),
    dueRemindedAt: new Date("2025-12-20T00:00:00Z"),
    secondRemindedAt: new Date("2025-12-25T00:00:00Z"),
    ...overrides,
}) as InstallmentPlanEntity

describe("InstallmentPlanService",
    () => {
        let module: TestingModule
        let service: InstallmentPlanService
        let entityManager: ManagerMockWithFindOneBy

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock() as ManagerMockWithFindOneBy
            // `recordPayment` looks the plan up by id via a typed `findOneBy`,
            // not the shared mock's `findOne` -- default to "not found"
            entityManager.findOneBy = jest.fn().mockResolvedValue(null)

            module = await Test.createTestingModule({
                providers: [
                    InstallmentPlanService,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<InstallmentPlanService>(InstallmentPlanService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("computeMinPaymentVnd",
            () => {
                it("returns the fixed monthly snapshot for a Fixed plan",
                    () => {
                        const min = service.computeMinPaymentVnd(
                            buildPlan({
                                planType: InstallmentPlanType.Fixed,
                                monthlyAmountVnd: 500000,
                            }),
                        )

                        expect(min).toBe(500000)
                    })

                it("falls back to 0 for a Fixed plan with no monthly snapshot",
                    () => {
                        const min = service.computeMinPaymentVnd(
                            buildPlan({
                                planType: InstallmentPlanType.Fixed,
                                monthlyAmountVnd: null,
                            }),
                        )

                        expect(min).toBe(0)
                    })

                it("uses the percent-of-remaining share for a FlexiblePool plan when it clears the floor",
                    () => {
                        // 10% of 10,000,000 = 1,000,000 > the 500,000 floor
                        const min = service.computeMinPaymentVnd(
                            buildPlan({
                                planType: InstallmentPlanType.FlexiblePool,
                                remainingVnd: 10000000,
                                minPaymentPercent: 10,
                                minPaymentFloorVnd: 500000,
                            }),
                        )

                        expect(min).toBe(1000000)
                    })

                it("falls back to the floor for a FlexiblePool plan whose balance has shrunk",
                    () => {
                        // 10% of 1,000,000 = 100,000 < the 500,000 floor -> floor wins
                        const min = service.computeMinPaymentVnd(
                            buildPlan({
                                planType: InstallmentPlanType.FlexiblePool,
                                remainingVnd: 1000000,
                                minPaymentPercent: 10,
                                minPaymentFloorVnd: 500000,
                            }),
                        )

                        expect(min).toBe(500000)
                    })

                it("ceils the percent-of-remaining share rather than truncating it",
                    () => {
                        // 10% of 1,000,001 = 100,000.1 -> ceil'd to 100,001, still under
                        // the floor here so the floor still wins -- use a floor low
                        // enough that the ceil'd share is the one that surfaces
                        const min = service.computeMinPaymentVnd(
                            buildPlan({
                                planType: InstallmentPlanType.FlexiblePool,
                                remainingVnd: 1000001,
                                minPaymentPercent: 10,
                                minPaymentFloorVnd: 1,
                            }),
                        )

                        expect(min).toBe(100001)
                    })

                it("treats a null remaining balance as zero for a FlexiblePool plan",
                    () => {
                        const min = service.computeMinPaymentVnd(
                            buildPlan({
                                planType: InstallmentPlanType.FlexiblePool,
                                remainingVnd: null,
                                minPaymentPercent: 10,
                                minPaymentFloorVnd: 500000,
                            }),
                        )

                        // 10% of 0 is 0 -> the floor is all that's left
                        expect(min).toBe(500000)
                    })
            })

        describe("recordPayment",
            () => {
                it("throws InstallmentPlanNotFoundException when the plan id does not resolve",
                    async () => {
                        entityManager.findOneBy.mockResolvedValueOnce(null)

                        await expect(
                            service.recordPayment({
                                planId: "missing-plan",
                                paidAmountVnd: 500000,
                            }),
                        ).rejects.toBeInstanceOf(InstallmentPlanNotFoundException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("Fixed: advances installmentsPaid by one and stays Active mid-schedule",
                    async () => {
                        const plan = buildPlan({
                            planType: InstallmentPlanType.Fixed,
                            months: 6,
                            installmentsPaid: 1,
                            monthlyAmountVnd: 500000,
                            status: InstallmentPlanStatus.Active,
                        })
                        entityManager.findOneBy.mockResolvedValueOnce(plan)

                        const result = await service.recordPayment({
                            planId: plan.id,
                            paidAmountVnd: 500000,
                        })

                        expect(plan.installmentsPaid).toBe(2)
                        expect(plan.status).toBe(InstallmentPlanStatus.Active)
                        expect(result.metMinimum).toBe(true)
                        expect(result.completed).toBe(false)
                        expect(entityManager.save).toHaveBeenCalledWith(plan)
                    })

                it("Fixed: completes the plan once the last installment is paid",
                    async () => {
                        const plan = buildPlan({
                            planType: InstallmentPlanType.Fixed,
                            months: 6,
                            installmentsPaid: 5,
                            monthlyAmountVnd: 500000,
                            status: InstallmentPlanStatus.Active,
                        })
                        entityManager.findOneBy.mockResolvedValueOnce(plan)

                        const result = await service.recordPayment({
                            planId: plan.id,
                            paidAmountVnd: 500000,
                        })

                        expect(plan.installmentsPaid).toBe(6)
                        expect(plan.status).toBe(InstallmentPlanStatus.Completed)
                        expect(result.completed).toBe(true)
                    })

                it("Fixed: unlocks gated enrollments when a defaulted plan catches up",
                    async () => {
                        const plan = buildPlan({
                            planType: InstallmentPlanType.Fixed,
                            months: 6,
                            installmentsPaid: 1,
                            monthlyAmountVnd: 500000,
                            status: InstallmentPlanStatus.Defaulted,
                            lockedCourseIds: [
                                "course-1",
                            ],
                        })
                        entityManager.findOneBy.mockResolvedValueOnce(plan)

                        await service.recordPayment({
                            planId: plan.id,
                            paidAmountVnd: 500000,
                        })

                        // Fixed always meets its own minimum -> a previously-defaulted
                        // plan is unlocked the moment ANY payment lands
                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                user: {
                                    id: plan.userId,
                                },
                            }),
                            {
                                isEnrolled: true,
                            },
                        )
                    })

                it("FlexiblePool: paying under the minimum shrinks the balance but leaves the plan Overdue",
                    async () => {
                        const plan = buildPlan({
                            planType: InstallmentPlanType.FlexiblePool,
                            remainingVnd: 10000000,
                            minPaymentPercent: 10,
                            minPaymentFloorVnd: 500000,
                            status: InstallmentPlanStatus.Overdue,
                        })
                        entityManager.findOneBy.mockResolvedValueOnce(plan)
                        const dueBefore = plan.nextDueAt

                        // minimum this cycle is 1,000,000 -- pay less than that
                        const result = await service.recordPayment({
                            planId: plan.id,
                            paidAmountVnd: 200000,
                        })

                        expect(plan.remainingVnd).toBe(9800000)
                        expect(result.metMinimum).toBe(false)
                        expect(result.completed).toBe(false)
                        // status/nextDueAt are left as-is -- still Overdue until topped up
                        expect(plan.status).toBe(InstallmentPlanStatus.Overdue)
                        expect(plan.nextDueAt).toBe(dueBefore)
                    })

                it("FlexiblePool: meeting the minimum advances the cycle and clears reminders",
                    async () => {
                        const plan = buildPlan({
                            planType: InstallmentPlanType.FlexiblePool,
                            remainingVnd: 10000000,
                            minPaymentPercent: 10,
                            minPaymentFloorVnd: 500000,
                            status: InstallmentPlanStatus.Overdue,
                            dueRemindedAt: new Date("2025-12-20T00:00:00Z"),
                            secondRemindedAt: new Date("2025-12-25T00:00:00Z"),
                        })
                        entityManager.findOneBy.mockResolvedValueOnce(plan)

                        // minimum this cycle is 1,000,000 -- pay exactly that
                        const result = await service.recordPayment({
                            planId: plan.id,
                            paidAmountVnd: 1000000,
                        })

                        expect(plan.remainingVnd).toBe(9000000)
                        expect(result.metMinimum).toBe(true)
                        expect(plan.status).toBe(InstallmentPlanStatus.Active)
                        expect(plan.dueRemindedAt).toBeNull()
                        expect(plan.secondRemindedAt).toBeNull()
                    })

                it("FlexiblePool: a payment that clears the balance completes the plan",
                    async () => {
                        const plan = buildPlan({
                            planType: InstallmentPlanType.FlexiblePool,
                            remainingVnd: 500000,
                            minPaymentPercent: 10,
                            minPaymentFloorVnd: 500000,
                            status: InstallmentPlanStatus.Overdue,
                        })
                        entityManager.findOneBy.mockResolvedValueOnce(plan)

                        const result = await service.recordPayment({
                            planId: plan.id,
                            paidAmountVnd: 500000,
                        })

                        expect(plan.remainingVnd).toBe(0)
                        expect(plan.status).toBe(InstallmentPlanStatus.Completed)
                        expect(result.completed).toBe(true)
                    })

                it("FlexiblePool: never lets the balance go negative on an overpayment",
                    async () => {
                        const plan = buildPlan({
                            planType: InstallmentPlanType.FlexiblePool,
                            remainingVnd: 300000,
                            minPaymentPercent: 10,
                            minPaymentFloorVnd: 500000,
                            status: InstallmentPlanStatus.Overdue,
                        })
                        entityManager.findOneBy.mockResolvedValueOnce(plan)

                        await service.recordPayment({
                            planId: plan.id,
                            paidAmountVnd: 1000000,
                        })

                        expect(plan.remainingVnd).toBe(0)
                    })
            })

        describe("applyPaymentForTransaction",
            () => {
                const transactionId = "txn-1"
                const planId = "plan-1"
                const paidAmountVnd = 500000

                it("claims the Pending→Succeeded transition and applies the payment on the winning call",
                    async () => {
                        // guarded UPDATE affects the row -> this call won the claim
                        entityManager.update.mockResolvedValueOnce({
                            affected: 1,
                        })
                        const plan = buildPlan({
                            planType: InstallmentPlanType.Fixed,
                            months: 6,
                            installmentsPaid: 1,
                        })
                        entityManager.findOneBy.mockResolvedValueOnce(plan)

                        const applied = await service.applyPaymentForTransaction({
                            transactionId,
                            planId,
                            paidAmountVnd,
                        })

                        expect(applied).toBe(true)
                        // the guard itself targeted the Pending row for this transaction
                        expect(entityManager.update).toHaveBeenCalledWith(
                            TransactionEntity,
                            {
                                id: transactionId,
                                status: TransactionStatus.Pending,
                            },
                            {
                                status: TransactionStatus.Succeeded,
                            },
                        )
                        // the claim was won -> the ledger mutation ran
                        expect(plan.installmentsPaid).toBe(2)
                        expect(entityManager.save).toHaveBeenCalledWith(plan)
                    })

                it("is a no-op when the guarded UPDATE affects no row (already claimed)",
                    async () => {
                        // second call (webhook + reconcile-poll double-fire): the row is
                        // no longer Pending, so the guarded UPDATE affects nothing
                        entityManager.update.mockResolvedValueOnce({
                            affected: 0,
                        })

                        const applied = await service.applyPaymentForTransaction({
                            transactionId,
                            planId,
                            paidAmountVnd,
                        })

                        expect(applied).toBe(false)
                        // losing the claim must never touch the plan's ledger
                        expect(entityManager.findOneBy).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })
    })
