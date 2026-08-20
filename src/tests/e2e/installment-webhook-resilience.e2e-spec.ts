import request from "supertest"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    InstallmentPlanStatus,
} from "@modules/databases/postgresql/primary/enums/installment-plan-status"
import {
    InstallmentPlanType,
} from "@modules/databases/postgresql/primary/enums/installment-plan-type"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    createE2eApp,
} from "@tests/helpers/create-e2e-app"
import type {
    E2eApp,
} from "@tests/helpers/types/e2e-app"
import {
    until,
} from "@tests/helpers/flow-wait"

const POSTGRESQL_PRIMARY = "primary"
const PAYMENT_AMOUNT = 500_000

interface SeededInstallmentPayment {
    plan: InstallmentPlanEntity
    transaction: TransactionEntity
}

/**
 * A signed provider callback for a later installment cycle must advance the
 * existing plan through the same atomic operation used by reconciliation.
 * The HTTP controller/CQRS handler and Postgres are real; only each provider's
 * external verification result is scripted.
 */
describe("an installment payment webhook advances its plan exactly once",
    () => {
        let e2e: E2eApp
        let entityManager: EntityManager

        beforeAll(async () => {
            e2e = await createE2eApp()
            entityManager = e2e.app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterAll(async () => {
            await e2e?.app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"installment_plans\", \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        const seedPayment = async (
            paymentType: PaymentType,
            referenceId: string,
        ): Promise<SeededInstallmentPayment> => {
            const user = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${referenceId}`,
                    }),
            )
            const plan = await entityManager.save(
                entityManager.create(InstallmentPlanEntity,
                    {
                        user,
                        originTransaction: null,
                        lockedCourseIds: [],
                        planType: InstallmentPlanType.FlexiblePool,
                        status: InstallmentPlanStatus.Overdue,
                        months: null,
                        monthlyAmountVnd: null,
                        totalAmountVnd: null,
                        markupPercent: null,
                        installmentsPaid: 0,
                        remainingVnd: 1_000_000,
                        minPaymentFloorVnd: PAYMENT_AMOUNT,
                        minPaymentPercent: 10,
                        nextDueAt: new Date("2026-08-01T00:00:00.000Z"),
                        secondReminderAfterDays: 7,
                        lockoutAfterDays: 14,
                        dueRemindedAt: new Date("2026-08-01T00:00:00.000Z"),
                        secondRemindedAt: null,
                    }),
            )
            const transaction = await entityManager.save(
                entityManager.create(TransactionEntity,
                    {
                        user,
                        referenceId,
                        amount: PAYMENT_AMOUNT,
                        pricingPhase: PricingPhase.Regular,
                        checkoutUrl: "https://payments.test/installment",
                        status: TransactionStatus.Pending,
                        paymentType,
                        actionType: ActionType.InstallmentPayment,
                        installmentPlanId: plan.id,
                    }),
            )
            return {
                plan,
                transaction,
            }
        }

        const expectAppliedOnce = async (
            seeded: SeededInstallmentPayment,
        ): Promise<void> => {
            await until(async () => (await entityManager.findOneBy(
                TransactionEntity,
                {
                    id: seeded.transaction.id,
                },
            ))?.status === TransactionStatus.Succeeded,
            {
                timeout: 20_000,
                describe: `installment transaction ${seeded.transaction.id} to settle`,
            })
            const transaction = await entityManager.findOneByOrFail(
                TransactionEntity,
                {
                    id: seeded.transaction.id,
                },
            )
            const plan = await entityManager.findOneByOrFail(
                InstallmentPlanEntity,
                {
                    id: seeded.plan.id,
                },
            )
            expect(transaction.status).toBe(TransactionStatus.Succeeded)
            expect(plan.remainingVnd).toBe(500_000)
            expect(plan.status).toBe(InstallmentPlanStatus.Active)
            expect(plan.dueRemindedAt).toBeNull()
        }

        it("applies a verified PayOS installment callback and ignores redelivery",
            async () => {
                const seeded = await seedPayment(PaymentType.PayOS,
                    "810001")
                e2e.payosClient.webhooks.verify.mockResolvedValue(undefined)
                const body = {
                    code: "00",
                    desc: "success",
                    success: true,
                    data: {
                        orderCode: "810001",
                        amount: PAYMENT_AMOUNT,
                    },
                    signature: "valid-signature",
                }

                await request(e2e.app.getHttpServer())
                    .post("/v1/payos/webhook")
                    .send(body)
                    .expect(200)
                await request(e2e.app.getHttpServer())
                    .post("/v1/payos/webhook")
                    .send(body)
                    .expect(200)

                await expectAppliedOnce(seeded)
            })

        it("applies a verified SePay installment callback and ignores redelivery",
            async () => {
                const seeded = await seedPayment(PaymentType.Sepay,
                    "INSTALLMENT-SEPAY-1")
                e2e.sepayClient.order.retrieve.mockResolvedValue({
                    data: {
                        data: {
                            order_status: "CAPTURED",
                            order_amount: PAYMENT_AMOUNT,
                        },
                    },
                })
                const body = {
                    order_invoice_number: "INSTALLMENT-SEPAY-1",
                }

                await request(e2e.app.getHttpServer())
                    .post("/v1/sepay/webhook")
                    .set("X-Secret-Key",
                        "e2e-sepay-secret")
                    .send(body)
                    .expect(200)
                await request(e2e.app.getHttpServer())
                    .post("/v1/sepay/webhook")
                    .set("X-Secret-Key",
                        "e2e-sepay-secret")
                    .send(body)
                    .expect(200)

                await expectAppliedOnce(seeded)
            })

        it("rejects an underpaid callback without advancing the plan",
            async () => {
                const seeded = await seedPayment(PaymentType.PayOS,
                    "810002")
                e2e.payosClient.webhooks.verify.mockResolvedValue(undefined)

                const response = await request(e2e.app.getHttpServer())
                    .post("/v1/payos/webhook")
                    .send({
                        code: "00",
                        success: true,
                        data: {
                            orderCode: "810002",
                            amount: PAYMENT_AMOUNT - 1,
                        },
                        signature: "valid-signature",
                    })

                expect(response.status).toBe(200)
                const transaction = await entityManager.findOneByOrFail(
                    TransactionEntity,
                    {
                        id: seeded.transaction.id,
                    },
                )
                const plan = await entityManager.findOneByOrFail(
                    InstallmentPlanEntity,
                    {
                        id: seeded.plan.id,
                    },
                )
                expect(transaction.status).toBe(TransactionStatus.Pending)
                expect(plan.remainingVnd).toBe(1_000_000)
                expect(plan.status).toBe(InstallmentPlanStatus.Overdue)
            })
    })
