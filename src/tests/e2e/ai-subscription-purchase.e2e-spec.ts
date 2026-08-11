import {
    CommandBus,
} from "@nestjs/cqrs"
import dayjs from "dayjs"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
import {
    AiSubStatus,
} from "@modules/databases/postgresql/primary/enums/ai-sub-status"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import type {
    AppConfig,
} from "@modules/filesystem/types/config"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    SEPAY,
} from "@modules/integrations/sepay/constants/sepay"
import {
    PAYOS,
} from "@modules/integrations/payos/constants/payos"
import {
    STRIPE,
} from "@modules/integrations/stripe/constants/stripe"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    PurchaseAiSubscriptionHandler,
} from "@features/api/core/graphql/mutations/ai/purchase-ai-subscription/purchase-ai-subscription.handler"
import {
    PurchaseAiSubscriptionCommand,
} from "@features/api/core/graphql/mutations/ai/purchase-ai-subscription/purchase-ai-subscription.command"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/**
 * A learner buys AI credit, the tier activates, and the model ceiling rises with it.
 *
 * THE PURCHASE IS NOT THE POINT -- THE CEILING IS. What a learner pays for here is which models
 * they may reach, so the flow ends by asking `resolveTierCategories` rather than by reading the
 * subscription row it just wrote. A row that says `plus` while the entitlement still answers with
 * the free allowance is the failure this catches, and it is invisible to any assertion that stops
 * at the database. See `e2e-flow.md` FLOW-2.
 *
 * IT PINS AN ASYMMETRY THE CODEBASE HAS NOT DECIDED ON. Membership renewals STACK on the time left
 * (`membership-purchase` proves it); an AI tier grant RESETS `currentPeriodEnd` to now plus one
 * month. So a learner who upgrades on day 25 of a paid month loses the remaining days. That may be
 * intended -- an upgrade is a new product, not an extension -- but the two products behaving
 * differently is not written down anywhere, so it is written down here, as an assertion that will
 * fail loudly if someone changes it by accident.
 *
 * Requires Docker -- the lane's globalSetup boots the real Postgres this writes to.
 */
describe("a learner buys an AI tier, and the model ceiling rises with it",
    () => {
        /** What the stubbed catalog charges for Plus. */
        const PLUS_PRICE_VND = 99_000

        /** What the stubbed catalog charges for Pro. */
        const PRO_PRICE_VND = 199_000

        let world: FlowWorld
        let commandBus: CommandBus
        let entitlement: AiEntitlementService
        /** Flipped by the last step to prove a withdrawn tier cannot be bought. */
        let plusEnabled: boolean

        // carried between steps: this is the flow's own state, and the reason it is one file
        let learnerId: string
        let plusTransactionId: string
        let freeCategoryCount: number
        let plusPeriodEnd: Date

        /** The mounted catalog, rebuilt per read so a step can withdraw a tier. */
        const mountFilesystemService = {
            appConfig: (): Partial<AppConfig> => ({
                subscriptions: {
                    tiers: [
                        {
                            tier: AiSubTier.Plus,
                            displayName: "Plus",
                            description: "e2e fixture tier",
                            priceVnd: PLUS_PRICE_VND,
                            priceUsd: 3.99,
                            creditsPer5h: 250,
                            creditsPerWeek: 2_500,
                            enabled: plusEnabled,
                        },
                        {
                            tier: AiSubTier.Pro,
                            displayName: "Pro",
                            description: "e2e fixture tier",
                            priceVnd: PRO_PRICE_VND,
                            priceUsd: 7.99,
                            creditsPer5h: 500,
                            creditsPerWeek: 5_000,
                            enabled: true,
                        },
                    ],
                },
            }),
        }

        /** Read the learner's subscription row, or null before the first grant. */
        const readSubscription = async (): Promise<AiSubscriptionEntity | null> =>
            world.entityManager.findOne(AiSubscriptionEntity,
                {
                    where: {
                        user: {
                            id: learnerId,
                        },
                    },
                })

        /** Buy one tier and return the pending order's id. */
        const purchase = async (
            tier: AiSubTier,
        ): Promise<string> => {
            const learner = await world.entityManager.findOneOrFail(UserEntity,
                {
                    where: {
                        id: learnerId,
                    },
                })
            const result = await commandBus.execute(
                new PurchaseAiSubscriptionCommand({
                    request: {
                        tier,
                        paymentType: PaymentType.Sepay,
                    },
                    user: learner,
                }),
            )
            return (result as { transactionId: string }).transactionId
        }

        beforeAll(async () => {
            plusEnabled = true

            world = await bootFlowWorld({
                providers: [
                    PurchaseAiSubscriptionHandler,
                    // REAL: the entitlement is what was bought
                    AiEntitlementService,
                    DayjsService,
                    RetryService,
                    {
                        provide: MountFilesystemService,
                        useValue: mountFilesystemService,
                    },
                    {
                        provide: SEPAY,
                        useValue: {
                            checkout: {
                                initCheckoutUrl: jest.fn(() => "https://sepay.test/checkout"),
                                initOneTimePaymentFields: jest.fn((fields: unknown) => fields),
                            },
                            order: {
                                retrieve: jest.fn(),
                            },
                        },
                    },
                    // the handler injects every gateway; the unused ones are stubbed so they can
                    // never reach the network
                    {
                        provide: PAYOS,
                        useValue: {
                            paymentRequests: {
                                create: jest.fn(),
                            },
                        },
                    },
                    {
                        provide: STRIPE,
                        useValue: {
                            checkout: {
                                sessions: {
                                    create: jest.fn(),
                                },
                            },
                        },
                    },
                    {
                        provide: PaypalClient,
                        useValue: {
                            createOrder: jest.fn(),
                        },
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: {
                            createInvoice: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
                    },
                ],
            })
            commandBus = world.app.get(CommandBus)
            entitlement = world.app.get(AiEntitlementService)

            await world.truncate(
                "ai_subscriptions",
                "transaction_items",
                "transactions",
                "enrollments",
                "users",
            )

            const learner = await world.mintLearner("ai-subscription")
            learnerId = learner.id
        })

        afterAll(async () => {
            // guarded: when `beforeAll` fails there is no world, and an unguarded close buries the
            // real error under a `Cannot read properties of undefined` from the teardown
            await world?.close()
        })

        it("reaches only the free models before paying anything",
            async () => {
                // the BEFORE half of the only comparison that matters. Without it, the after-state
                // could be the default and every later assertion would still pass.
                const categories = await entitlement.resolveTierCategories({
                    userId: learnerId,
                })
                freeCategoryCount = categories.length
                expect(freeCategoryCount).toBeGreaterThan(0)
            })

        it("checks out, and the order is pending against the chosen tier",
            async () => {
                plusTransactionId = await purchase(AiSubTier.Plus)

                const order = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: plusTransactionId,
                        },
                    })
                expect(order.status).toBe(TransactionStatus.Pending)
                expect(order.actionType).toBe(ActionType.AiSubscriptionPurchase)
                expect(order.amount).toBe(PLUS_PRICE_VND)
                expect(order.aiSubTier).toBe(AiSubTier.Plus)

                // nothing is granted before the money settles
                await expect(readSubscription()).resolves.toBeNull()
            })

        it("activates the tier and raises the ceiling when the payment settles",
            async () => {
                const granted = await entitlement.grantTier({
                    userId: learnerId,
                    tier: AiSubTier.Plus,
                    transactionId: plusTransactionId,
                })
                expect(granted).toBe(true)

                const subscription = await readSubscription()
                expect(subscription?.tier).toBe(AiSubTier.Plus)
                expect(subscription?.status).toBe(AiSubStatus.Active)
                plusPeriodEnd = subscription?.currentPeriodEnd as Date

                // the money is settled by the grant itself -- the claim IS the settle
                const settled = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: plusTransactionId,
                        },
                    })
                expect(settled.status).toBe(TransactionStatus.Succeeded)

                // AND THE THING ACTUALLY BOUGHT: more models than the free allowance
                const categories = await entitlement.resolveTierCategories({
                    userId: learnerId,
                })
                expect(categories.length).toBeGreaterThan(freeCategoryCount)
            })

        it("grants nothing when the same payment is delivered twice",
            async () => {
                const grantedAgain = await entitlement.grantTier({
                    userId: learnerId,
                    tier: AiSubTier.Plus,
                    transactionId: plusTransactionId,
                })
                expect(grantedAgain).toBe(false)

                // the period is untouched: asserting only the boolean would pass on an
                // implementation that returns false AFTER moving the date
                const subscription = await readSubscription()
                expect(subscription?.currentPeriodEnd).toEqual(plusPeriodEnd)
            })

        it("restarts the period on an upgrade instead of stacking it, unlike membership",
            async () => {
                const proTransactionId = await purchase(AiSubTier.Pro)
                const granted = await entitlement.grantTier({
                    userId: learnerId,
                    tier: AiSubTier.Pro,
                    transactionId: proTransactionId,
                })
                expect(granted).toBe(true)

                const subscription = await readSubscription()
                expect(subscription?.tier).toBe(AiSubTier.Pro)

                /*
                 * ONE month out, not two. `grantTier` assigns `now + SUBSCRIPTION_PERIOD_MONTHS`
                 * outright, where membership takes the later of now and the unexpired end. Pinned
                 * rather than judged: if the asymmetry is deliberate this assertion documents it,
                 * and if it is not, this is the file that says so out loud.
                 */
                const daysOut = dayjs(subscription?.currentPeriodEnd as Date).diff(dayjs(),
                    "day")
                expect(daysOut).toBeGreaterThan(27)
                expect(daysOut).toBeLessThan(32)
            })

        it("refuses a tier the catalog has withdrawn",
            async () => {
                /*
                 * THE CATALOG IS THE PRICE LIST, and a withdrawn tier must stop being sellable the
                 * moment it is switched off -- otherwise a learner pays for a product that is no
                 * longer configured, and the grant lands with a price nobody set.
                 */
                plusEnabled = false

                await expect(purchase(AiSubTier.Plus)).rejects.toThrow()
            })
    })
