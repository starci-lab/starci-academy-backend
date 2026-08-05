import request from "supertest"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ActionType,
    AiSubStatus,
    AiSubscriptionEntity,
    AiSubTier,
    PaymentType,
    PricingPhase,
    TransactionEntity,
    TransactionStatus,
    UserEntity,
} from "@modules/databases"
import {
    createE2eApp,
} from "@tests/helpers"
import type {
    E2eApp,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** URI of the SePay webhook (controller path "sepay", version "1", post "webhook"). */
const WEBHOOK_URL = "/v1/sepay/webhook"

describe("SePay webhook (e2e)",
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
            // TypeORM's shutdown hook looks up the default (unnamed) DataSource,
            // which this named-only setup doesn't register -- ignore that noise.
            await e2e.app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // wipe the rows each test created so cases stay independent
            await entityManager.query(
                "TRUNCATE TABLE \"ai_subscriptions\", \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /**
         * Seed a user + a pending AI-subscription-purchase transaction and return
         * the persisted transaction (its `referenceId` is the webhook invoice).
         */
        const seedPendingPurchase = async (
            referenceId: string,
        ): Promise<TransactionEntity> => {
            // only keycloakId is required on the user row
            const user = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${referenceId}`,
                    }),
            )
            // a pending purchase the webhook will settle into a granted tier
            return entityManager.save(
                entityManager.create(TransactionEntity,
                    {
                        user,
                        referenceId,
                        amount: 99_000,
                        pricingPhase: PricingPhase.Regular,
                        checkoutUrl: "https://pay.test/checkout",
                        status: TransactionStatus.Pending,
                        paymentType: PaymentType.Sepay,
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: AiSubTier.Plus,
                    }),
            )
        }

        it("grants the tier and marks the transaction succeeded on a valid IPN",
            async () => {
                const transaction = await seedPendingPurchase("INV-OK")
                // server-to-server verification succeeds (any 2xx-shaped payload)
                e2e.sepayClient.order.retrieve.mockResolvedValueOnce({
                    data: {
                        status: "PAID",
                    },
                })

                await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: "INV-OK",
                    })
                    .expect(201)

                // verification was driven off our referenceId, not the IPN body
                expect(e2e.sepayClient.order.retrieve)
                    .toHaveBeenCalledWith("INV-OK")

                // the funding transaction is now settled
                const settled = await entityManager.findOne(TransactionEntity,
                    {
                        where: {
                            id: transaction.id,
                        },
                    })
                expect(settled?.status).toBe(TransactionStatus.Succeeded)

                // a Plus entitlement row exists and is active for the buyer
                const subscription = await entityManager.findOne(
                    AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: transaction.userId,
                            },
                        },
                    },
                )
                expect(subscription?.tier).toBe(AiSubTier.Plus)
                expect(subscription?.status).toBe(AiSubStatus.Active)
            })

        it("rejects an IPN with no invoice and mutates nothing",
            async () => {
                const response = await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        status: "PAID",
                    })

                // missing order_invoice_number -> handler throws, request fails
                expect(response.status).toBeGreaterThanOrEqual(400)
                // never reached the verification call
                expect(e2e.sepayClient.order.retrieve).not.toHaveBeenCalled()
                // no entitlement was granted
                const count = await entityManager.count(AiSubscriptionEntity)
                expect(count).toBe(0)
            })

        it("rejects an unknown invoice without granting anything",
            async () => {
                const response = await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: "INV-DOES-NOT-EXIST",
                    })

                expect(response.status).toBeGreaterThanOrEqual(400)
                const count = await entityManager.count(AiSubscriptionEntity)
                expect(count).toBe(0)
            })

        it("is idempotent — a re-delivered IPN cannot grant twice",
            async () => {
                await seedPendingPurchase("INV-DUP")
                e2e.sepayClient.order.retrieve.mockResolvedValue({
                    data: {
                        status: "PAID",
                    },
                })

                // first delivery settles the purchase
                await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: "INV-DUP",
                    })
                    .expect(201)

                // second delivery finds no pending transaction -> rejected
                const replay = await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: "INV-DUP",
                    })
                expect(replay.status).toBeGreaterThanOrEqual(400)

                // exactly one entitlement row exists (no double grant)
                const count = await entityManager.count(AiSubscriptionEntity)
                expect(count).toBe(1)
            })
    })
