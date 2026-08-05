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

/** URI of the payOS webhook (controller path "payos", version "1", post "webhook"). */
const WEBHOOK_URL = "/v1/payos/webhook"

/**
 * Build a payOS webhook body. The handler matches a transaction off
 * `data.orderCode` (stringified) and verifies the body via the SDK.
 */
const payosBody = (orderCode: string) => ({
    code: "00",
    desc: "success",
    success: true,
    data: {
        orderCode,
        amount: 99_000,
        description: "AI subscription",
        accountNumber: "0001",
        reference: "ref",
        transactionDateTime: "2026-06-11T00:00:00Z",
        currency: "VND",
        paymentLinkId: "plink",
        code: "00",
        desc: "success",
    },
    signature: "valid-signature",
})

describe("payOS webhook (e2e)",
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
         * the persisted transaction (its `referenceId` is the payOS orderCode).
         */
        const seedPendingPurchase = async (
            orderCode: string,
        ): Promise<TransactionEntity> => {
            // only keycloakId is required on the user row
            const user = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${orderCode}`,
                    }),
            )
            // a pending purchase the webhook will settle into a granted tier
            return entityManager.save(
                entityManager.create(TransactionEntity,
                    {
                        user,
                        referenceId: orderCode,
                        amount: 99_000,
                        pricingPhase: PricingPhase.Regular,
                        checkoutUrl: "https://pay.test/checkout",
                        status: TransactionStatus.Pending,
                        paymentType: PaymentType.PayOS,
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: AiSubTier.Plus,
                    }),
            )
        }

        it("grants the tier and marks the transaction succeeded on a valid webhook",
            async () => {
                const transaction = await seedPendingPurchase("700001")
                // signature verification passes
                e2e.payosClient.webhooks.verify.mockResolvedValueOnce(undefined)

                await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send(payosBody("700001"))
                    .expect(201)

                // the SDK was asked to verify the inbound body
                expect(e2e.payosClient.webhooks.verify).toHaveBeenCalledTimes(1)

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

        it("rejects a webhook with a bad signature and mutates nothing",
            async () => {
                await seedPendingPurchase("700002")
                // signature verification fails -> handler throws before any grant
                e2e.payosClient.webhooks.verify.mockRejectedValueOnce(
                    new Error("invalid signature"),
                )

                const response = await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send(payosBody("700002"))

                expect(response.status).toBeGreaterThanOrEqual(400)
                // the transaction stays pending, no entitlement was granted
                const count = await entityManager.count(AiSubscriptionEntity)
                expect(count).toBe(0)
                const stillPending = await entityManager.count(TransactionEntity,
                    {
                        where: {
                            status: TransactionStatus.Pending,
                        },
                    })
                expect(stillPending).toBe(1)
            })

        it("acks a verified webhook for an unknown order (URL-probe shape) without granting anything",
            async () => {
                // valid signature but no matching pending transaction exists.
                // Unlike SePay/Stripe, the PayOS handler treats an unmatched order
                // as an unmatched probe/stray callback -- it logs and ACKs (201)
                // rather than throwing, so PayOS never marks the webhook URL
                // "inactive" and retries a real callback into a black hole.
                e2e.payosClient.webhooks.verify.mockResolvedValueOnce(undefined)

                await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send(payosBody("999999"))
                    .expect(201)

                const count = await entityManager.count(AiSubscriptionEntity)
                expect(count).toBe(0)
            })

        it("is idempotent — a re-delivered webhook cannot grant twice",
            async () => {
                await seedPendingPurchase("700003")
                // every delivery passes signature verification
                e2e.payosClient.webhooks.verify.mockResolvedValue(undefined)

                // first delivery settles the purchase
                await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send(payosBody("700003"))
                    .expect(201)

                // second delivery finds no matching PENDING transaction (already
                // settled) -- same "unmatched order" path as the probe case above,
                // so the handler ACKs (201) rather than throwing; the entitlement
                // count staying at 1 is what actually proves no double grant
                await request(e2e.app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send(payosBody("700003"))
                    .expect(201)

                // exactly one entitlement row exists (no double grant)
                const count = await entityManager.count(AiSubscriptionEntity)
                expect(count).toBe(1)
            })
    })
