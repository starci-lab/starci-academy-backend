import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ActionType,
    InstallmentPlanEntity,
    InstallmentPlanStatus,
    InstallmentPlanType,
    PaymentType,
    PricingPhase,
    TransactionEntity,
    TransactionStatus,
    UserEntity,
} from "@modules/databases"
import {
    InstallmentPlanService,
} from "@modules/bussiness"
import {
    DayjsService,
} from "@modules/mixin"
import {
    createE2eApp,
} from "../helpers/create-e2e-app"
import type {
    E2eApp,
} from "../helpers/create-e2e-app"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Params for the local `seedFixedPlan` helper. */
interface SeedFixedPlanParams {
    months: number
    installmentsPaid: number
}

/**
 * Exercises `InstallmentPlanService.applyPaymentForTransaction` against a
 * real Postgres connection -- the exact call `ReconcileTransactionWorker
 * .finalize()`'s `ActionType.InstallmentPayment` branch makes (see
 * `reconcile-transaction.worker.ts` -- the branch is a bare guard + this one
 * delegate, so driving the service call IS driving that branch). Covers
 * `findings.md` #3: no e2e existed for pay-next-installment or the reconcile
 * worker's InstallmentPayment path, and no test proved the round-1 atomic
 * claim actually stops a double-fire from double-crediting the NON-idempotent
 * `recordPayment` ledger mutation.
 */
describe("Installment payment reconcile (e2e)",
    () => {
        let e2e: E2eApp
        let entityManager: EntityManager
        let installmentPlanService: InstallmentPlanService

        beforeAll(async () => {
            e2e = await createE2eApp()
            entityManager = e2e.app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            // real service, real DayjsService (no external deps) -- same
            // combination `ReconcileTransactionWorker` is constructed with
            installmentPlanService = new InstallmentPlanService(
                entityManager,
                new DayjsService(),
            )
        })

        afterAll(async () => {
            // TypeORM's shutdown hook looks up the default (unnamed) DataSource,
            // which this named-only setup doesn't register -- ignore that noise.
            await e2e.app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // wipe the rows each test created so cases stay independent
            await entityManager.query(
                "TRUNCATE TABLE \"installment_plans\", \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (
            referenceId: string,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${referenceId}`,
                    }),
            )

        /**
         * Seed a `Fixed` installment plan (no `originTransaction` -- the
         * origin checkout is out of scope for this cycle-payment flow) with
         * `months`/`installmentsPaid` controlling how many cycles remain.
         */
        const seedFixedPlan = async (
            user: UserEntity,
            {
                months,
                installmentsPaid,
            }: SeedFixedPlanParams,
        ): Promise<InstallmentPlanEntity> => {
            const monthlyAmountVnd = 500_000
            return entityManager.save(
                entityManager.create(InstallmentPlanEntity,
                    {
                        user,
                        originTransaction: null,
                        lockedCourseIds: [],
                        planType: InstallmentPlanType.Fixed,
                        status: InstallmentPlanStatus.Active,
                        months,
                        monthlyAmountVnd,
                        totalAmountVnd: monthlyAmountVnd * months,
                        markupPercent: 10,
                        installmentsPaid,
                        nextDueAt: new Date(),
                    }),
            )
        }

        /**
         * Seed a Pending `InstallmentPayment` transaction linked to `plan` --
         * mirrors what `PayNextInstallmentHandler` creates for one cycle's
         * checkout (`installmentPlanId` set, amount = the cycle's minimum).
         */
        const seedPendingInstallmentPayment = async (
            user: UserEntity,
            plan: InstallmentPlanEntity,
            referenceId: string,
        ): Promise<TransactionEntity> =>
            entityManager.save(
                entityManager.create(TransactionEntity,
                    {
                        user,
                        referenceId,
                        amount: plan.monthlyAmountVnd ?? 0,
                        pricingPhase: PricingPhase.Regular,
                        checkoutUrl: "https://pay.test/checkout",
                        status: TransactionStatus.Pending,
                        paymentType: PaymentType.Sepay,
                        actionType: ActionType.InstallmentPayment,
                        installmentPlanId: plan.id,
                    }),
            )

        it("advances the plan exactly once — a repeated finalize on the same transaction is a no-op",
            async () => {
                const user = await seedUser("INST-1")
                const plan = await seedFixedPlan(user,
                    {
                        months: 3,
                        installmentsPaid: 1,
                    })
                const transaction = await seedPendingInstallmentPayment(user,
                    plan,
                    "INST-1")

                // first finalize: claims Pending -> Succeeded and applies the payment
                const firstApplied = await installmentPlanService.applyPaymentForTransaction({
                    transactionId: transaction.id,
                    planId: plan.id,
                    paidAmountVnd: transaction.amount,
                })
                expect(firstApplied).toBe(true)

                const settled = await entityManager.findOne(TransactionEntity,
                    {
                        where: {
                            id: transaction.id,
                        },
                    })
                expect(settled?.status).toBe(TransactionStatus.Succeeded)

                const afterFirst = await entityManager.findOneByOrFail(
                    InstallmentPlanEntity,
                    {
                        id: plan.id,
                    },
                )
                // one cycle advanced: 1 -> 2, still short of months(3)
                expect(afterFirst.installmentsPaid).toBe(2)
                expect(afterFirst.status).toBe(InstallmentPlanStatus.Active)

                // second finalize on the SAME now-Succeeded transaction (the
                // webhook + reconcile-poll double-fire this guards against) --
                // the atomic claim (`UPDATE ... WHERE status = 'pending'`)
                // affects 0 rows, so recordPayment must NOT run again
                const secondApplied = await installmentPlanService.applyPaymentForTransaction({
                    transactionId: transaction.id,
                    planId: plan.id,
                    paidAmountVnd: transaction.amount,
                })
                expect(secondApplied).toBe(false)

                const afterSecond = await entityManager.findOneByOrFail(
                    InstallmentPlanEntity,
                    {
                        id: plan.id,
                    },
                )
                // still 2, NOT 3 -- the ledger was not double-applied
                expect(afterSecond.installmentsPaid).toBe(2)
                expect(afterSecond.status).toBe(InstallmentPlanStatus.Active)
            })

        it("completes the plan when installmentsPaid reaches months",
            async () => {
                const user = await seedUser("INST-2")
                // last cycle of a 2-month plan (already paid cycle 1)
                const plan = await seedFixedPlan(user,
                    {
                        months: 2,
                        installmentsPaid: 1,
                    })
                const transaction = await seedPendingInstallmentPayment(user,
                    plan,
                    "INST-2")

                const applied = await installmentPlanService.applyPaymentForTransaction({
                    transactionId: transaction.id,
                    planId: plan.id,
                    paidAmountVnd: transaction.amount,
                })
                expect(applied).toBe(true)

                const finished = await entityManager.findOneByOrFail(
                    InstallmentPlanEntity,
                    {
                        id: plan.id,
                    },
                )
                expect(finished.installmentsPaid).toBe(2)
                expect(finished.status).toBe(InstallmentPlanStatus.Completed)

                const settled = await entityManager.findOne(TransactionEntity,
                    {
                        where: {
                            id: transaction.id,
                        },
                    })
                expect(settled?.status).toBe(TransactionStatus.Succeeded)
            })
    })
