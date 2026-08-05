import {
    mkdtempSync,
    writeFileSync,
} from "fs"
import {
    tmpdir,
} from "os"
import {
    join,
} from "path"
import request from "supertest"
import type {
    Stripe,
} from "stripe"
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

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** URI of the Stripe webhook (controller path "stripe", version "1", post "webhook"). */
const WEBHOOK_URL = "/v1/stripe/webhook"

/**
 * The verified webhook event union the SDK hands back. The v22 SDK no longer
 * exposes a `Stripe.Event` namespace type through the CommonJS entry point, so
 * the union is read off the client method that produces it.
 */
type StripeEvent = ReturnType<Stripe["webhooks"]["constructEvent"]>

/** The Checkout Session carried by a `checkout.session.completed` event. */
type StripeCheckoutSession = Extract<StripeEvent, {
    type: "checkout.session.completed"
}>["data"]["object"]

/**
 * Craft a minimal `checkout.session.completed` Stripe event whose session
 * echoes our `referenceId` back via `client_reference_id`. The injected Stripe
 * mock returns this object from `constructEvent`, so its exact bytes do not need
 * to be a real signed payload.
 */
const completedEvent = (
    referenceId: string | null,
): StripeEvent => ({
    id: "evt_test",
    object: "event",
    type: "checkout.session.completed",
    data: {
        object: {
            id: "cs_test",
            object: "checkout.session",
            client_reference_id: referenceId,
            // the handler only grants when funds have actually cleared -- a
            // `checkout.session.completed` event can fire for an async payment
            // method whose session is still `payment_status: "unpaid"`. Without
            // this the handler silently no-ops (logs + returns) on every case
            // below, so nothing ever gets granted.
            payment_status: "paid",
        } as StripeCheckoutSession,
    },
} as unknown as StripeEvent)

describe("Stripe webhook (e2e)",
    () => {
        let e2e: E2eApp
        let entityManager: EntityManager

        beforeAll(async () => {
            // the handler reads the webhook signing secret from a mount file via
            // getStripeWebhookSecret() -- point that path at a throwaway temp file
            // so the read succeeds (its value is irrelevant: constructEvent is mocked)
            const dir = mkdtempSync(join(tmpdir(),
                "stripe-e2e-"))
            const secretPath = join(dir,
                "stripe-webhook-secret.key")
            writeFileSync(secretPath,
                "whsec_test_secret")
            process.env.TERRAFORM_STRIPE_WEBHOOK_SECRET_MOUNT_PATH = secretPath

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
         * the persisted transaction (its `referenceId` is the session reference).
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
                        paymentType: PaymentType.Stripe,
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: AiSubTier.Plus,
                    }),
            )
        }

        /** POST a raw JSON body + signature header to the webhook route. */
        const postWebhook = (
            signature: string,
        ) =>
            request(e2e.app.getHttpServer())
                .post(WEBHOOK_URL)
                .set("stripe-signature",
                    signature)
                .set("content-type",
                    "application/json")
                // send a raw string so the controller's rawBody is populated
                .send("{}")

        it("grants the tier and marks the transaction succeeded on a valid event",
            async () => {
                const transaction = await seedPendingPurchase("STRIPE-OK")
                // signature verification passes -> returns our crafted event
                e2e.stripeClient.webhooks.constructEvent.mockReturnValueOnce(
                    completedEvent("STRIPE-OK"),
                )

                await postWebhook("valid-sig")
                    .expect(201)

                // the SDK was asked to verify + construct the event
                expect(e2e.stripeClient.webhooks.constructEvent)
                    .toHaveBeenCalledTimes(1)

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

        it("rejects an event with a bad signature and mutates nothing",
            async () => {
                await seedPendingPurchase("STRIPE-BADSIG")
                // constructEvent throws on a signature mismatch -> request rejected
                e2e.stripeClient.webhooks.constructEvent.mockImplementationOnce(
                    () => {
                        throw new Error("No signatures found matching the expected signature")
                    },
                )

                const response = await postWebhook("bad-sig")

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

        it("rejects a verified event whose session has no reference id",
            async () => {
                await seedPendingPurchase("STRIPE-NOREF")
                // valid signature but the session carries no client_reference_id
                e2e.stripeClient.webhooks.constructEvent.mockReturnValueOnce(
                    completedEvent(null),
                )

                const response = await postWebhook("valid-sig")

                expect(response.status).toBeGreaterThanOrEqual(400)
                const count = await entityManager.count(AiSubscriptionEntity)
                expect(count).toBe(0)
            })

        it("is idempotent — a re-delivered event cannot grant twice",
            async () => {
                await seedPendingPurchase("STRIPE-DUP")
                // every delivery passes verification and returns the same event
                e2e.stripeClient.webhooks.constructEvent.mockReturnValue(
                    completedEvent("STRIPE-DUP"),
                )

                // first delivery settles the purchase
                await postWebhook("valid-sig")
                    .expect(201)

                // second delivery finds no pending transaction -> rejected
                const replay = await postWebhook("valid-sig")
                expect(replay.status).toBeGreaterThanOrEqual(400)

                // exactly one entitlement row exists (no double grant)
                const count = await entityManager.count(AiSubscriptionEntity)
                expect(count).toBe(1)
            })
    })
