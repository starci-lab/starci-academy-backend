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
    MembershipEntity,
} from "@modules/databases/postgresql/primary/entities/membership.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    MembershipStatus,
} from "@modules/databases/postgresql/primary/enums/membership-status"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    MembershipService,
} from "@modules/membership/membership.service"
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
    PurchaseMembershipHandler,
} from "@features/api/core/graphql/mutations/membership/purchase-membership/purchase-membership.handler"
import {
    PurchaseMembershipResolver,
} from "@features/api/core/graphql/mutations/membership/purchase-membership/purchase-membership.resolver"
import {
    PurchaseMembershipService,
} from "@features/api/core/graphql/mutations/membership/purchase-membership/purchase-membership.service"
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
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
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
 * A learner buys community membership, the period opens, and buying again stacks rather than resets.
 *
 * THE CONSEQUENCE IS A DATE, NOT A ROW. Membership is worth exactly the time it grants, so every
 * assertion here is about `currentPeriodEnd` moving -- or pointedly NOT moving on a duplicate. A
 * flow that only checked `status === "active"` would pass on a system that silently threw away a
 * renewal, which is the mistake this file exists to catch. See `e2e-flow.md` FLOW-2.
 *
 * Checkout enters through GraphQL HTTP and settlement enters through the provider HTTP webhook.
 *
 * Requires Docker -- the lane's globalSetup boots the real Postgres this writes to.
 */
describe("a learner buys membership, and buying again extends rather than restarts it",
    () => {
        /** Monthly VND price the stubbed `app.yaml` membership section returns. */
        const MEMBERSHIP_PRICE_VND = 99_000

        /** Monthly USD price for the international gateways. */
        const MEMBERSHIP_PRICE_USD = 4.99

        /** How long one payment buys, per `MEMBERSHIP_PERIOD_MONTHS`. */
        const PERIOD_MONTHS = 1

        let world: FlowWorld
        let membershipEnabled: boolean
        let currentUser: UserEntity | null = null
        let sepayClient: {
            checkout: {
                initCheckoutUrl: jest.Mock
                initOneTimePaymentFields: jest.Mock
            }
            order: {
                retrieve: jest.Mock
            }
        }

        // carried between steps: this is the flow's own state, and the reason it is one file
        let learnerId: string
        let firstTransactionId: string
        let firstPeriodEnd: Date

        /** The mounted product config, rebuilt per read so a step can flip the kill switch. */
        const mountFilesystemService = {
            appConfig: (): Partial<AppConfig> => ({
                membership: {
                    priceVnd: MEMBERSHIP_PRICE_VND,
                    priceUsd: MEMBERSHIP_PRICE_USD,
                    courseDiscountPercent: 20,
                    freeMonthsOnCoursePurchase: 1,
                    enabled: membershipEnabled,
                },
                subscriptions: {
                    tiers: [],
                },
            }),
        }

        /** Read the learner's membership row, or null before the first grant. */
        const readMembership = async (): Promise<MembershipEntity | null> =>
            world.entityManager.findOne(MembershipEntity,
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
            mutation Purchase($request: PurchaseMembershipRequest!) {
                purchaseMembership(request: $request) {
                    success
                    error
                    data { transactionId referenceId checkoutUrl amount }
                }
            }
        `

        /** Buy membership once through GraphQL and return the pending order's id. */
        const purchase = async (): Promise<string> => {
            const response = await request(world.app.getHttpServer())
                .post("/graphql")
                .send({
                    query: PURCHASE_MUTATION,
                    variables: {
                        request: {
                            paymentType: PaymentType.Sepay
                        }
                    },
                })
            const payload = response.body.data.purchaseMembership
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
            sepayClient.order.retrieve.mockResolvedValue({
                data: {
                    data: {
                        order_invoice_number: transaction.referenceId,
                        order_amount: String(transaction.amount),
                        order_status: "CAPTURED",
                    }
                },
            })
            const response = await request(world.app.getHttpServer())
                .post("/sepay/webhook")
                .send({
                    order: {
                        order_invoice_number: transaction.referenceId,
                        order_amount: String(transaction.amount),
                        order_status: "CAPTURED",
                    }
                })
            expect(response.status).toBe(201)
        }

        beforeAll(async () => {
            jest.spyOn(KeycloakAuthGraphQLGuard.prototype,
                "canActivate").mockImplementation(fakeAuthGuard.canActivate)
            membershipEnabled = true
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
                    PurchaseMembershipResolver,
                    PurchaseMembershipService,
                    PurchaseMembershipHandler,
                    // REAL: the grant is the subject of this flow
                    MembershipService,
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
                    AiEntitlementService,
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
                "memberships",
                "transaction_items",
                "transactions",
                "users",
            )

            const learner = await world.mintLearner("membership-purchase")
            learnerId = learner.id
            currentUser = learner
        })

        afterAll(async () => {
            // guarded: when `beforeAll` fails there is no world, and an unguarded close buries the
            // real error under a `Cannot read properties of undefined` from the teardown
            await world?.close()
        })

        it("checks out, and the order is pending against the membership product",
            async () => {
                firstTransactionId = await purchase()

                const order = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: firstTransactionId,
                        },
                    })
                expect(order.status).toBe(TransactionStatus.Pending)
                expect(order.actionType).toBe(ActionType.MembershipPurchase)
                expect(order.amount).toBe(MEMBERSHIP_PRICE_VND)

                // nothing is granted before the money settles
                await expect(readMembership()).resolves.toBeNull()
            })

        it("opens the period when the payment settles",
            async () => {
                await settle(firstTransactionId)

                const membership = await readMembership()
                expect(membership?.status).toBe(MembershipStatus.Active)

                firstPeriodEnd = membership?.currentPeriodEnd as Date
                // roughly one month out; a day of slack rather than a clock-exact equality, because
                // the assertion is "a period was bought", not "the machine ticked at this instant"
                const monthsOut = dayjs(firstPeriodEnd).diff(dayjs(),
                    "day")
                expect(monthsOut).toBeGreaterThan(27)
                expect(monthsOut).toBeLessThan(32)

                // the same call settles the money -- the grant IS the claim
                const settled = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: firstTransactionId,
                        },
                    })
                expect(settled.status).toBe(TransactionStatus.Succeeded)
            })

        it("grants nothing when the same payment is delivered twice",
            async () => {
                /*
                 * THE DUPLICATE, AND WHY IT IS FREE TIME IF IT IS WRONG.
                 *
                 * A gateway retries; the webhook and the reconcile poll can both reach a settled
                 * order. The guard is the atomic pending -> succeeded claim inside grantMembership,
                 * so a second call must return false AND leave the date alone. Asserting only the
                 * boolean would pass on an implementation that returns false after extending.
                 */
                await settle(firstTransactionId)

                const membership = await readMembership()
                expect(membership?.currentPeriodEnd).toEqual(firstPeriodEnd)
            })

        it("stacks the next payment on the time still left, rather than restarting it",
            async () => {
                const secondTransactionId = await purchase()
                await settle(secondTransactionId)

                const membership = await readMembership()
                const end = membership?.currentPeriodEnd as Date

                // TWO months out, not one: renewing early must not throw away what was paid for.
                // This is the assertion a "reset to now + 1 month" implementation fails.
                const daysOut = dayjs(end).diff(dayjs(),
                    "day")
                expect(daysOut).toBeGreaterThan(27 * (PERIOD_MONTHS + 1))
                expect(dayjs(end).isAfter(dayjs(firstPeriodEnd))).toBe(true)
            })

        it("refuses to sell membership while the product is switched off",
            async () => {
                /*
                 * THE KILL SWITCH IS A BUSINESS CONTROL, not a config nicety: it is what stops sales
                 * during an outage or a price change. If it stops being read, the first sign is a
                 * charge for a product that is not being delivered.
                 */
                membershipEnabled = false

                await expect(purchase()).rejects.toThrow()

                // and no order was left behind for a purchase that never happened
                const orders = await world.entityManager.count(TransactionEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                            actionType: ActionType.MembershipPurchase,
                        },
                    })
                expect(orders).toBe(2)
            })
    })
