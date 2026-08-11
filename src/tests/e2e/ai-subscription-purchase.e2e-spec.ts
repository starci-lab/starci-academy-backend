import request from "supertest"
import type {
    ExecutionContext,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakJwksService
} from "@modules/integrations/keycloak/jwks.service"
import {
    SessionService
} from "@modules/platform/session/session.service"
import {
    CookieService
} from "@modules/platform/cookie/cookie.service"
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
    PurchaseAiSubscriptionResolver,
} from "@features/api/core/graphql/mutations/ai/purchase-ai-subscription/purchase-ai-subscription.resolver"
import {
    PurchaseAiSubscriptionService,
} from "@features/api/core/graphql/mutations/ai/purchase-ai-subscription/purchase-ai-subscription.service"
import {
    SepayWebhookController,
} from "@features/api/core/http/sepay/webhook/webhook.controller"
import {
    SepayWebhookService,
} from "@features/api/core/http/sepay/webhook/webhook.service"
import {
    SepayWebhookHandler,
} from "@features/api/core/http/sepay/webhook/webhook.handler"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/**
 * A learner buys AI credit through GraphQL, the provider settles through HTTP, and the tier opens.
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
        /** Flipped by the last step to prove a withdrawn tier cannot be bought. */
        let plusEnabled: boolean
        let currentUser: UserEntity | null = null
        let sepayClient: {
            checkout: { initCheckoutUrl: jest.Mock; initOneTimePaymentFields: jest.Mock }
            order: { retrieve: jest.Mock }
        }

        // carried between steps: this is the flow's own state, and the reason it is one file
        let learnerId: string
        let plusTransactionId: string
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

        const fakeAuthGuard = {
            canActivate: async (context: ExecutionContext): Promise<boolean> => {
                if (!currentUser) return false
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return Promise.resolve(true)
            },
        }

        const PURCHASE_MUTATION = `
            mutation Purchase($request: PurchaseAiSubscriptionRequest!) {
                purchaseAiSubscription(request: $request) {
                    success error
                    data { transactionId referenceId checkoutUrl amount }
                }
            }
        `

        /** Buy one tier through GraphQL and return the pending order's id. */
        const purchase = async (
            tier: AiSubTier,
        ): Promise<string> => {
            const response = await request(world.app.getHttpServer())
                .post("/graphql")
                .send({
                    query: PURCHASE_MUTATION, variables: {
                        request: {
                            tier, paymentType: PaymentType.Sepay
                        },
                    }
                })
            const payload = response.body.data.purchaseAiSubscription
            expect(response.status).toBe(200)
            expect(payload.success).toBe(true)
            expect(payload.error).toBeNull()
            return payload.data.transactionId
        }

        const settle = async (transactionId: string): Promise<void> => {
            const transaction = await world.entityManager.findOneByOrFail(TransactionEntity,
                {
                    id: transactionId,
                })
            const order = {
                order_invoice_number: transaction.referenceId,
                order_amount: String(transaction.amount),
                order_status: "CAPTURED",
            }
            sepayClient.order.retrieve.mockResolvedValue({
                data: {
                    data: order
                }
            })
            const response = await request(world.app.getHttpServer())
                .post("/sepay/webhook")
                .send({
                    order
                })
            expect(response.status).toBe(201)
        }

        beforeAll(async () => {
            jest.spyOn(KeycloakAuthGraphQLGuard.prototype,
                "canActivate").mockImplementation(fakeAuthGuard.canActivate)
            plusEnabled = true
            sepayClient = {
                checkout: {
                    initCheckoutUrl: jest.fn(() => "https://sepay.test/checkout"),
                    initOneTimePaymentFields: jest.fn((fields: unknown) => fields),
                },
                order: {
                    retrieve: jest.fn()
                },
            }

            world = await bootFlowWorld({
                imports: [ApolloServerModule.register({
                    type: ApolloServerType.Monolithic,
                    useServices: false,
                })],
                controllers: [SepayWebhookController],
                providers: [
                    PurchaseAiSubscriptionResolver,
                    PurchaseAiSubscriptionService,
                    PurchaseAiSubscriptionHandler,
                    // REAL: the entitlement is what was bought
                    AiEntitlementService,
                    InstallmentPlanService,
                    DayjsService,
                    RetryService,
                    {
                        provide: MountFilesystemService,
                        useValue: mountFilesystemService,
                    },
                    {
                        provide: SEPAY,
                        useValue: sepayClient,
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
                    SepayWebhookService,
                    SepayWebhookHandler,
                    MembershipService,
                    {
                        provide: EnqueueEnrollJobService, useValue: {
                            enqueueForTransaction: jest.fn()
                        }
                    },
                    {
                        provide: EnqueueSendMailJobService, useValue: {
                            enqueue: jest.fn()
                        }
                    },
                    {
                        provide: NotificationService, useValue: {
                            createNotification: jest.fn()
                        }
                    },
                    {
                        provide: KeycloakAuthGraphQLGuard, useValue: fakeAuthGuard
                    },
                    {
                        provide: KeycloakJwksService, useValue: {
                        }
                    },
                    {
                        provide: SessionService, useValue: {
                        }
                    },
                    {
                        provide: CookieService, useValue: {
                        }
                    },
                    {
                        provide: WinstonService, useValue: {
                            log: jest.fn()
                        }
                    },
                ],
            })

            await world.truncate(
                "ai_subscriptions",
                "transaction_items",
                "transactions",
                "enrollments",
                "users",
            )

            const learner = await world.mintLearner("ai-subscription")
            learnerId = learner.id
            currentUser = learner
        })

        afterAll(async () => {
            // guarded: when `beforeAll` fails there is no world, and an unguarded close buries the
            // real error under a `Cannot read properties of undefined` from the teardown
            await world?.close()
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
                await settle(plusTransactionId)

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

            })

        it("grants nothing when the same payment is delivered twice",
            async () => {
                await settle(plusTransactionId)

                // the period is untouched: asserting only the boolean would pass on an
                // implementation that returns false AFTER moving the date
                const subscription = await readSubscription()
                expect(subscription?.currentPeriodEnd).toEqual(plusPeriodEnd)
            })

        it("restarts the period on an upgrade instead of stacking it, unlike membership",
            async () => {
                const proTransactionId = await purchase(AiSubTier.Pro)
                await settle(proTransactionId)

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
