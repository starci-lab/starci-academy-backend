import {
    CommandBus,
} from "@nestjs/cqrs"
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
    PurchaseMembershipCommand,
} from "@features/api/core/graphql/mutations/membership/purchase-membership/purchase-membership.command"
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
 * THE GRANT IS RUN DIRECTLY, NOT THROUGH A WEBHOOK. `MembershipService.grantMembership` is the
 * single finalize path both the gateway webhook and the reconcile poll call -- proved in
 * `course-payment-abandoned` -- so driving it here tests the grant itself rather than re-testing
 * the transport a sibling flow already covers.
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
        let commandBus: CommandBus
        let membershipService: MembershipService
        let membershipEnabled: boolean

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

        /** Buy membership once and return the pending order's id. */
        const purchase = async (): Promise<string> => {
            const learner = await world.entityManager.findOneOrFail(UserEntity,
                {
                    where: {
                        id: learnerId,
                    },
                })
            const result = await commandBus.execute(
                new PurchaseMembershipCommand({
                    request: {
                        paymentType: PaymentType.Sepay,
                    },
                    user: learner,
                }),
            )
            return (result as { transactionId: string }).transactionId
        }

        beforeAll(async () => {
            membershipEnabled = true

            world = await bootFlowWorld({
                providers: [
                    PurchaseMembershipHandler,
                    // REAL: the grant is the subject of this flow
                    MembershipService,
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
            membershipService = world.app.get(MembershipService)

            await world.truncate(
                "memberships",
                "transaction_items",
                "transactions",
                "users",
            )

            const learner = await world.mintLearner("membership-purchase")
            learnerId = learner.id
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
                const granted = await membershipService.grantMembership({
                    userId: learnerId,
                    transactionId: firstTransactionId,
                })
                expect(granted).toBe(true)

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
                const grantedAgain = await membershipService.grantMembership({
                    userId: learnerId,
                    transactionId: firstTransactionId,
                })
                expect(grantedAgain).toBe(false)

                const membership = await readMembership()
                expect(membership?.currentPeriodEnd).toEqual(firstPeriodEnd)
            })

        it("stacks the next payment on the time still left, rather than restarting it",
            async () => {
                const secondTransactionId = await purchase()
                const granted = await membershipService.grantMembership({
                    userId: learnerId,
                    transactionId: secondTransactionId,
                })
                expect(granted).toBe(true)

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
