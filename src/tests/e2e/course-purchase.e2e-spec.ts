import {
    CommandBus,
} from "@nestjs/cqrs"
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
    TransactionItemEntity,
} from "@modules/databases/postgresql/primary/entities/transaction-item.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    EnrollStepService,
} from "@features/api/processors/enroll/steps/enroll-step.service"
import {
    TransactionActionService,
} from "@modules/bussiness/transactions/atomic/transaction-action.service"
import {
    CourseStatsProjectionService,
} from "@modules/bussiness/projections/course-stats/course-stats-projection.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EnqueueResolveGithubJobService,
} from "@modules/bussiness/jobs/enqueue/resolve-github.service"
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
    LoyaltyDiscountService,
} from "@modules/bussiness/loyalty/loyalty-discount.service"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    UserXpProjectionService,
} from "@modules/bussiness/projections/user-xp/user-xp-projection.service"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    SepayWebhookHandler,
} from "@features/api/core/http/sepay/webhook/webhook.handler"
import {
    SepayWebhookCommand,
} from "@features/api/core/http/sepay/webhook/webhook.command"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"
import {
    until,
} from "@tests/helpers/flow-wait"

/**
 * A learner buys a course, and the purchase reaches the point where enrolment is handed off.
 *
 * ONE FLOW, IN ORDER, AS NAMED STEPS. Each `it` is a step of the same purchase and depends on the
 * one before it -- which is the one place a test may do that, because the promise being proved only
 * exists as a sequence. Checkout alone proves nothing; a settled webhook alone proves nothing; the
 * value is the join. See `e2e-flow.md` FLOW-1 and FLOW-2.
 *
 * IT GOES THROUGH THE BUS, NOT THE HANDLER. Dispatching `CoursesCheckoutCommand` rather than
 * calling `CoursesCheckoutHandler.execute` proves the handler is REGISTERED and routed, not merely
 * imported -- a class of breakage where every unit spec stays green because it constructs the
 * handler itself.
 *
 * WHERE THIS FLOW STOPS, AND WHY. The webhook does not open the enrolment: for a course purchase it
 * hands off to the enrol worker. So the promise this file proves is "the money settled and the
 * enrolment was handed off for the right course"; opening the row is the worker's step and belongs
 * to a flow that runs it.
 *
 * Requires Docker -- the lane's globalSetup boots the real Postgres this writes to.
 */
describe("a learner buys a course and the enrolment is handed off",
    () => {
        /** Raw EarlyBird VND price seeded on the fixture course (before the non-prod /100 divisor). */
        const EARLYBIRD_PRICE_VND = 1_000_000

        /** One course, so the discount arithmetic is not what this flow is about. */
        const EXPECTED_TOTAL_VND = 10_000

        let world: FlowWorld
        let commandBus: CommandBus
        let enrollStep: EnrollStepService
        let enqueueEnrollJob: {
            enqueueForTransaction: jest.Mock
        }
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
        let courseId: string
        let transactionId: string
        let referenceId: string

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
            enqueueEnrollJob = {
                enqueueForTransaction: jest.fn().mockResolvedValue({
                    enqueuedCount: 1,
                }),
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
                    SepayWebhookHandler,
                    // the worker half: real where it writes rows, stubbed only where it leaves
                    // the process (a queue, an outbound mail, a GitHub lookup)
                    EnrollStepService,
                    TransactionActionService,
                    CourseStatsProjectionService,
                    UserService,
                    VoucherService,
                    {
                        provide: JobActionService,
                        useValue: {
                            saveExecutionResult: jest.fn(),
                            startJob: jest.fn(),
                            increaseJob: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueResolveGithubJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
                    },
                    AiEntitlementService,
                    DayjsService,
                    RetryService,
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
                    {
                        provide: EnqueueEnrollJobService,
                        useValue: enqueueEnrollJob,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
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
            enrollStep = world.app.get(EnrollStepService)

            await world.truncate(
                "transaction_items",
                "transactions",
                "enrollments",
                "pricing_phases",
                "courses",
                "users",
            )

            const learner = await world.mintLearner("course-purchase")
            learnerId = learner.id

            const course = await world.entityManager.save(
                world.entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "course-purchase-flow",
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

        it("checks out, and the order is left pending with one line for the course",
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
                referenceId = order.referenceId

                // the CONSEQUENCE, read from where it lives -- not the response envelope
                expect(order.status).toBe(TransactionStatus.Pending)
                expect(order.amount).toBe(EXPECTED_TOTAL_VND)

                const items = await world.entityManager.find(TransactionItemEntity,
                    {
                        where: {
                            transaction: {
                                id: transactionId,
                            },
                        },
                    })
                expect(items).toHaveLength(1)
                expect(items[0].amount).toBe(EXPECTED_TOTAL_VND)
            })

        it("hands the enrolment off when the provider reports the order captured",
            async () => {
                // the provider's REAL envelope, double-nested: the handler reads the authoritative
                // paid flag from `data.data`, and a flat stub would have proved a shape the
                // provider never sends
                sepayClient.order.retrieve.mockResolvedValue({
                    data: {
                        data: {
                            order_invoice_number: referenceId,
                            order_amount: String(EXPECTED_TOTAL_VND),
                            order_status: "CAPTURED",
                        },
                    },
                })

                await commandBus.execute(
                    new SepayWebhookCommand({
                        order: {
                            order_invoice_number: referenceId,
                            order_amount: String(EXPECTED_TOTAL_VND),
                            order_status: "CAPTURED",
                        },
                    }),
                )

                // the hand-off is the promise this half ends on, and it must be for THIS order
                await until(() => enqueueEnrollJob.enqueueForTransaction.mock.calls.length === 1,
                    {
                        timeout: 10_000,
                        describe: "the enrolment to be handed off to the worker",
                    })
                const [handedOff] = enqueueEnrollJob.enqueueForTransaction.mock.calls[0]
                expect((handedOff as { transaction: TransactionEntity }).transaction.id)
                    .toBe(transactionId)

                /*
                 * THE ORDER IS STILL PENDING HERE, AND THAT IS THE CONTRACT.
                 *
                 * This flow first asserted that the webhook settles the transaction, and the step
                 * timed out -- because for a course purchase the webhook writes no status at all:
                 * it hands off and returns, and the settle belongs to the enrol worker. The
                 * assertion was wrong, not the system, and pinning it here is what stops the next
                 * author assuming otherwise.
                 */
                const stillPending = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    })
                expect(stillPending.status).toBe(TransactionStatus.Pending)
            })

        it("opens the enrolment when the worker runs the handed-off job",
            async () => {
                const [handedOff] = enqueueEnrollJob.enqueueForTransaction.mock.calls[0]
                const paidTransaction = (handedOff as { transaction: TransactionEntity }).transaction

                /*
                 * The worker is driven with the payload the fan-out builds -- one job per course.
                 * The fan-out ITSELF is not run here: it needs a live BullMQ queue and Redis, so
                 * what this flow proves about it is the shape asserted in the step above, that it
                 * was handed exactly this transaction.
                 */
                await enrollStep.process({
                    payload: {
                        userId: learnerId,
                        courseId,
                        transactionId: paidTransaction.id,
                    },
                    queueName: "enroll",
                    job: {
                        id: "flow-enroll-job",
                    },
                    extended: undefined,
                } as never)

                // DONE, and this is what done means: the row exists and the learner owns the course
                const enrolment = await world.entityManager.findOneOrFail(EnrollmentEntity,
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
                expect(enrolment.isEnrolled).toBe(true)

                // and the money is settled, which the webhook did NOT do -- it is the worker's step
                const settled = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    })
                expect(settled.status).toBe(TransactionStatus.Succeeded)
            })

        it("hands nothing off for a reference the gateway does not know",
            async () => {
                enqueueEnrollJob.enqueueForTransaction.mockClear()

                await expect(
                    commandBus.execute(
                        new SepayWebhookCommand({
                            order: {
                                order_invoice_number: "not-a-real-reference",
                                order_amount: String(EXPECTED_TOTAL_VND),
                                order_status: "CAPTURED",
                            },
                        }),
                    ),
                ).rejects.toThrow()

                /*
                 * THE NEGATIVE, AND IT IS THE ONE THAT MATTERS.
                 *
                 * Every positive assertion above passes just as happily on a webhook that enrols
                 * whoever asks. Only this one fails if the reference stops being checked -- and a
                 * gateway notification is an endpoint a stranger can POST to.
                 *
                 * Note what is NOT asserted: that a re-delivery of the SAME reference hands off
                 * only once. It does not -- the order is still pending, so the webhook runs again.
                 * Idempotency for a course purchase lives in the enrol worker, and it is proved by
                 * the flow that runs the worker, not by this one.
                 */
                expect(enqueueEnrollJob.enqueueForTransaction).not.toHaveBeenCalled()
            })
    })
