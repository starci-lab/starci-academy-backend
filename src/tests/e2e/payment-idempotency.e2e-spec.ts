import request from "supertest"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
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
    AiSubStatus,
} from "@modules/databases/postgresql/primary/enums/ai-sub-status"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
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

const POSTGRESQL_PRIMARY = "primary"
const WEBHOOK_URL = "/v1/sepay/webhook"

/**
 * The provider calls twice and nothing doubles.
 *
 * This uses the real HTTP controller, command bus, webhook handler, atomic
 * transaction claim, and AI entitlement write. Only the provider client is
 * stubbed. A duplicate known invoice must receive a success response so SePay
 * stops retrying, while an unknown invoice remains rejected.
 */
describe("the provider calls twice and nothing doubles",
    () => {
        const INVOICE = "payment-idempotency-flow"

        let e2e: E2eApp
        let entityManager: EntityManager
        let transactionId: string
        let learnerId: string
        let subscriptionId: string
        let firstPeriodEnd: Date | null

        beforeAll(async () => {
            e2e = await createE2eApp()
            entityManager = e2e.app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            await entityManager.query(
                "TRUNCATE TABLE \"ai_subscriptions\", \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )

            const learner = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-payment-idempotency-flow",
                    }),
            )
            learnerId = learner.id
            const transaction = await entityManager.save(
                entityManager.create(TransactionEntity,
                    {
                        user: learner,
                        course: null,
                        referenceId: INVOICE,
                        providerPaymentId: null,
                        amount: 99_000,
                        discountPercent: 0,
                        voucherCode: null,
                        pricingPhase: PricingPhase.Regular,
                        checkoutUrl: "https://sepay.test/checkout",
                        status: TransactionStatus.Pending,
                        paymentType: PaymentType.Sepay,
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: AiSubTier.Plus,
                        installmentPlanId: null,
                        installmentMonths: null,
                        installmentMarkupPercent: null,
                        installmentTotalVnd: null,
                        refundReference: null,
                        refundReason: null,
                        refundedAt: null,
                    }),
            )
            transactionId = transaction.id
            e2e.sepayClient.order.retrieve.mockResolvedValue({
                data: {
                    status: "PAID",
                    order_amount: transaction.amount,
                },
            })
        })

        afterAll(async () => {
            await e2e?.app.close().catch(() => undefined)
        })

        it("settles the first webhook and grants one entitlement",
            async () => {
                await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: INVOICE,
                    })
                    .expect(201)

                const transaction = await entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    })
                expect(transaction.status).toBe(TransactionStatus.Succeeded)
                const subscriptions = await entityManager.find(AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                        },
                    })
                expect(subscriptions).toHaveLength(1)
                expect(subscriptions[0].tier).toBe(AiSubTier.Plus)
                expect(subscriptions[0].status).toBe(AiSubStatus.Active)
                subscriptionId = subscriptions[0].id
                firstPeriodEnd = subscriptions[0].currentPeriodEnd
            })

        it("acknowledges the duplicate webhook without extending or duplicating the entitlement",
            async () => {
                await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: INVOICE,
                    })
                    .expect(201)

                const subscriptions = await entityManager.find(AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                        },
                    })
                expect(subscriptions).toHaveLength(1)
                expect(subscriptions[0].id).toBe(subscriptionId)
                expect(subscriptions[0].currentPeriodEnd).toEqual(firstPeriodEnd)
                expect(e2e.sepayClient.order.retrieve).toHaveBeenCalledTimes(1)
            })

        it("still rejects an unknown invoice without creating another entitlement",
            async () => {
                const response = await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: "unknown-payment-reference",
                    })
                expect(response.status).toBeGreaterThanOrEqual(400)
                expect(await entityManager.count(AiSubscriptionEntity)).toBe(1)
            })
    })
