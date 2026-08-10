import {
    CommandBus,
} from "@nestjs/cqrs"
import SuperJSON from "superjson"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    PricingPhaseEntity,
} from "@modules/databases/postgresql/primary/entities/pricing-phase.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
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
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    TransactionActionService,
} from "@modules/bussiness/transactions/atomic/transaction-action.service"
import {
    TransactionReconcileQueryService,
} from "@modules/bussiness/transactions/atomic/transaction-reconcile-query.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
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
    MembershipService,
} from "@modules/membership/membership.service"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    UserXpProjectionService,
} from "@modules/bussiness/projections/user-xp/user-xp-projection.service"
import {
    LoyaltyDiscountService,
} from "@modules/bussiness/loyalty/loyalty-discount.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    CoursesCheckoutHandler,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.handler"
import {
    CoursesCheckoutCommand,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.command"
import {
    CoursesCheckoutPricingService,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout-pricing.service"
import {
    CoursePricingService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-pricing.service"
import {
    ReconcileTransactionWorker,
} from "@features/api/processors/reconcile-transaction/reconcile-transaction.worker"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/**
 * A learner checks out, the gateway never captures, and the order dies without granting anything.
 *
 * THIS IS THE UNHAPPY MONEY FLOW THE SUITE WAS MISSING, and it is the one that decides whether the
 * business loses money or gives away a course. Every assertion in `course-purchase` passes equally
 * well on a system that enrols on checkout; only a flow that ends in a NON-payment can tell the
 * difference. See `e2e-flow.md` FLOW-3.
 *
 * WHY NOT `course-refund`. The flow plan asks for capture -> settlement failure -> refund. There is
 * no refund: nothing in `src` reverses a settled course payment, and the Stripe handler's own
 * comment ("refunds, disputes, etc. handled elsewhere") points at an elsewhere that does not exist.
 * Writing that file would test an intention. What the system DOES implement is the abandonment path
 * below -- the reconcile poll, the `unpaid` terminal state, and the guarantee that access never
 * opens -- so that is what is proved here, and the refund gap is left visible rather than papered
 * over with a green test.
 *
 * THE GATEWAY CLIENT IS THE ONLY THING STUBBED. `TransactionReconcileQueryService` runs for real
 * against a stubbed SePay SDK, so this flow also proves the mapping from the provider's vocabulary
 * ("cancelled", "captured") onto `paid | unpaid | unknown` -- the seam where a provider's wording
 * change silently turns an abandoned order into a granted one.
 *
 * Requires Docker -- the lane's globalSetup boots the real Postgres this writes to.
 */
describe("a learner checks out, the gateway never captures, and nothing is granted",
    () => {
        /** Raw EarlyBird VND price seeded on the fixture course (before the non-prod /100 divisor). */
        const EARLYBIRD_PRICE_VND = 1_000_000

        /** What one course costs after that divisor -- the discount arithmetic is not the subject. */
        const EXPECTED_TOTAL_VND = 10_000

        /** `API_TRANSACTION_RECONCILE_MAX_ATTEMPTS` default: the poll gives up at the fifth. */
        const MAX_ATTEMPTS = 5

        let world: FlowWorld
        let commandBus: CommandBus
        let worker: ReconcileTransactionWorker
        let superJson: SuperJSON
        let sepayClient: {
            checkout: {
                initCheckoutUrl: jest.Mock
                initOneTimePaymentFields: jest.Mock
            }
            order: {
                retrieve: jest.Mock
            }
        }
        let enqueueReconcile: {
            enqueue: jest.Mock
        }
        let enqueueEnrollJob: {
            enqueueForTransaction: jest.Mock
        }
        let enqueueSendMail: {
            enqueue: jest.Mock
        }

        // carried between steps: this is the flow's own state, and the reason it is one file
        let learnerId: string
        let courseId: string
        let transactionId: string

        /**
         * Drive one reconcile poll the way BullMQ would, with the payload superjson-encoded.
         * @param attempt - which poll this is; the worker gives up once it reaches MAX_ATTEMPTS.
         */
        const poll = async (
            attempt: number,
        ): Promise<void> => worker.process({
            data: superJson.stringify({
                transactionId,
                attempt,
            }),
        } as unknown as Parameters<ReconcileTransactionWorker["process"]>[0])

        beforeAll(async () => {
            sepayClient = {
                checkout: {
                    initCheckoutUrl: jest.fn(() => "https://sepay.test/checkout"),
                    initOneTimePaymentFields: jest.fn((fields: unknown) => fields),
                },
                order: {
                    retrieve: jest.fn(),
                },
            }
            enqueueReconcile = {
                enqueue: jest.fn().mockResolvedValue(undefined),
            }
            enqueueEnrollJob = {
                enqueueForTransaction: jest.fn().mockResolvedValue({
                    enqueuedCount: 1,
                }),
            }
            enqueueSendMail = {
                enqueue: jest.fn().mockResolvedValue(undefined),
            }

            world = await bootFlowWorld({
                providers: [
                    CoursesCheckoutHandler,
                    CoursesCheckoutPricingService,
                    CoursePricingService,
                    LoyaltyDiscountService,
                    UserStatsProjectionService,
                    UserXpProjectionService,
                    InstallmentPlanService,
                    // the reconcile half, real where it decides and writes
                    ReconcileTransactionWorker,
                    TransactionReconcileQueryService,
                    TransactionActionService,
                    VoucherService,
                    AiEntitlementService,
                    DayjsService,
                    RetryService,
                    createSuperJsonServiceProvider(),
                    {
                        provide: SEPAY,
                        useValue: sepayClient,
                    },
                    // the checkout handler injects EVERY gateway, not just the one this flow pays
                    // with -- stubbed so the unused ones can never reach the network
                    {
                        provide: PAYOS,
                        useValue: {
                            paymentRequests: {
                                create: jest.fn(),
                                get: jest.fn(),
                            },
                            webhooks: {
                                verify: jest.fn(),
                            },
                        },
                    },
                    {
                        provide: STRIPE,
                        useValue: {
                            checkout: {
                                sessions: {
                                    create: jest.fn(),
                                    retrieve: jest.fn(),
                                },
                            },
                            webhooks: {
                                constructEvent: jest.fn(),
                            },
                        },
                    },
                    {
                        provide: PaypalClient,
                        useValue: {
                            createOrder: jest.fn(),
                            getOrder: jest.fn(),
                        },
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: {
                            createInvoice: jest.fn(),
                            getPaymentStatus: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcile,
                    },
                    {
                        provide: EnqueueEnrollJobService,
                        useValue: enqueueEnrollJob,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMail,
                    },
                    {
                        provide: NotificationService,
                        useValue: {
                            create: jest.fn(),
                        },
                    },
                    {
                        provide: MembershipService,
                        useValue: {
                            grantMembership: jest.fn(),
                        },
                    },
                ],
            })
            commandBus = world.app.get(CommandBus)
            worker = world.app.get(ReconcileTransactionWorker)
            superJson = world.app.get<SuperJSON>(SUPERJSON)

            await world.truncate(
                "transaction_items",
                "transactions",
                "enrollments",
                "pricing_phases",
                "courses",
                "users",
            )

            const learner = await world.mintLearner("payment-abandoned")
            learnerId = learner.id
            // an address, because `enqueueLearnerEmail` returns silently for a user without one --
            // so a learner minted with only a keycloakId would make the "the buyer is told" step
            // pass for the wrong reason, by never reaching the enqueue at all
            await world.entityManager.update(UserEntity,
                {
                    id: learnerId,
                },
                {
                    email: "abandoned-buyer@starci.test",
                })

            const course = await world.entityManager.save(
                world.entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "course-payment-abandoned-flow",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            courseId = course.id
            await world.entityManager.save(
                world.entityManager.create(PricingPhaseEntity,
                    {
                        course,
                        phase: PricingPhase.EarlyBird,
                        price: EARLYBIRD_PRICE_VND,
                    }),
            )
        })

        afterAll(async () => {
            // guarded: when `beforeAll` fails there is no world, and an unguarded close buries the
            // real error under a `Cannot read properties of undefined` from the teardown
            await world?.close()
        })

        it("checks out, and the order waits on the gateway",
            async () => {
                sepayClient.order.retrieve.mockResolvedValue(undefined)

                const learner = await world.entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: learnerId,
                        },
                    })

                const result = await commandBus.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                courseId,
                            ],
                            paymentType: PaymentType.Sepay,
                            returnUrl: "https://academy.test/return",
                            cancelUrl: "https://academy.test/cancel",
                        },
                        user: learner,
                    }),
                )
                transactionId = result.transactionId

                const order = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    })
                expect(order.status).toBe(TransactionStatus.Pending)
                expect(order.amount).toBe(EXPECTED_TOTAL_VND)

                /*
                 * CHECKOUT BOOKS THE FIRST POLL ITSELF, and that is the safety net this whole flow
                 * depends on: without it an order whose webhook never arrives would sit pending for
                 * ever, holding a voucher and telling the buyer nothing. This step originally
                 * asserted the re-enqueue count in isolation and failed at 2-vs-1 -- the extra call
                 * was this booking, so it is asserted here rather than subtracted later.
                 */
                expect(enqueueReconcile.enqueue).toHaveBeenCalledTimes(1)
                expect(enqueueReconcile.enqueue.mock.calls[0][0]).toMatchObject({
                    transactionId,
                })
                /*
                 * NOTE WHERE THE `attempt` IS. Checkout books the poll with the id alone; the
                 * counter defaults to 1 inside EnqueueReconcileTransactionJobService, which is
                 * stubbed here -- so asserting `attempt: 1` on this call asserts a default that
                 * lives on the far side of the stub. It fails, and it should: a stub boundary is
                 * exactly where a test stops being allowed to claim things.
                 */
                enqueueReconcile.enqueue.mockClear()
            })

        it("keeps polling while the gateway has not decided, and grants nothing meanwhile",
            async () => {
                // the provider's real envelope, double-nested, reporting an order still open
                sepayClient.order.retrieve.mockResolvedValue({
                    data: {
                        data: {
                            order_status: "PENDING",
                        },
                    },
                })

                await poll(1)

                // it asked for another poll rather than deciding
                expect(enqueueReconcile.enqueue).toHaveBeenCalledTimes(1)
                expect(enqueueReconcile.enqueue.mock.calls[0][0]).toMatchObject({
                    transactionId,
                    attempt: 2,
                })

                // and NOTHING was granted on the way -- an open order is not a paid one
                const stillPending = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    })
                expect(stillPending.status).toBe(TransactionStatus.Pending)
                expect(enqueueEnrollJob.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("marks the order unpaid when the gateway says it was cancelled, and tells the buyer",
            async () => {
                enqueueReconcile.enqueue.mockClear()
                sepayClient.order.retrieve.mockResolvedValue({
                    data: {
                        data: {
                            order_status: "CANCELLED",
                        },
                    },
                })

                // a terminal answer ends it immediately -- the remaining poll budget is irrelevant
                await poll(2)

                const settled = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    })
                expect(settled.status).toBe(TransactionStatus.Unpaid)

                // no further poll was booked: `unpaid` is terminal, and a poll loop that keeps
                // running against a dead order is how a queue fills up with work nobody reads
                expect(enqueueReconcile.enqueue).not.toHaveBeenCalled()

                // the buyer is told once, on the single pending -> unpaid transition
                expect(enqueueSendMail.enqueue).toHaveBeenCalledTimes(1)
            })

        it("opens no enrolment, which is the whole point",
            async () => {
                // THE CONSEQUENCE THAT MATTERS. Every other assertion is about bookkeeping; this one
                // is about whether an unpaid learner can read the course.
                const enrolment = await world.entityManager.findOne(EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                            course: {
                                id: courseId,
                            },
                        },
                    })
                expect(enrolment).toBeNull()
                expect(enqueueEnrollJob.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("never touches an order the webhook already settled",
            async () => {
                enqueueSendMail.enqueue.mockClear()
                enqueueReconcile.enqueue.mockClear()

                /*
                 * THE RACE THIS GUARDS, AND WHY IT IS THE MOST IMPORTANT STEP IN THE FILE.
                 *
                 * The reconcile poll is booked at checkout and fires on a delay, so a webhook that
                 * arrives late can settle an order that a poll is already mid-flight against. If the
                 * worker wrote `unpaid` unconditionally it would revoke a payment the bank took --
                 * the failure mode nobody notices until a paying learner is locked out.
                 *
                 * The guard is a status check on entry, so it is proved by asking the worker to
                 * reconcile an order that is already succeeded and watching it decline.
                 */
                await world.entityManager.update(TransactionEntity,
                    {
                        id: transactionId,
                    },
                    {
                        status: TransactionStatus.Succeeded,
                    })

                sepayClient.order.retrieve.mockResolvedValue({
                    data: {
                        data: {
                            order_status: "CANCELLED",
                        },
                    },
                })
                // the last poll in the budget, the one that would otherwise write `unpaid`
                await poll(MAX_ATTEMPTS)

                const untouched = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    })
                expect(untouched.status).toBe(TransactionStatus.Succeeded)
                expect(enqueueSendMail.enqueue).not.toHaveBeenCalled()
                expect(enqueueReconcile.enqueue).not.toHaveBeenCalled()
            })
    })
