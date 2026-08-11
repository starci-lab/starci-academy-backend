import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
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
    InstallmentPlanStatus,
} from "@modules/databases/postgresql/primary/enums/installment-plan-status"
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
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    CourseStatsProjectionService,
} from "@modules/bussiness/projections/course-stats/course-stats-projection.service"
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
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    EnqueueResolveGithubJobService,
} from "@modules/bussiness/jobs/enqueue/resolve-github.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    LoyaltyDiscountService,
} from "@modules/bussiness/loyalty/loyalty-discount.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    TransactionActionService,
} from "@modules/bussiness/transactions/atomic/transaction-action.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    PAYOS,
} from "@modules/integrations/payos/constants/payos"
import {
    SEPAY,
} from "@modules/integrations/sepay/constants/sepay"
import {
    STRIPE,
} from "@modules/integrations/stripe/constants/stripe"
import {
    CoursePricingService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-pricing.service"
import {
    CoursesCheckoutCommand,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.command"
import {
    CoursesCheckoutHandler,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.handler"
import {
    CoursesCheckoutPricingService,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout-pricing.service"
import {
    PayNextInstallmentCommand,
} from "@features/api/core/graphql/mutations/installment-plans/pay-next-installment/pay-next-installment.command"
import {
    PayNextInstallmentHandler,
} from "@features/api/core/graphql/mutations/installment-plans/pay-next-installment/pay-next-installment.handler"
import {
    SepayWebhookCommand,
} from "@features/api/core/http/sepay/webhook/webhook.command"
import {
    SepayWebhookHandler,
} from "@features/api/core/http/sepay/webhook/webhook.handler"
import {
    EnrollStepService,
} from "@features/api/processors/enroll/steps/enroll-step.service"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/**
 * A learner pays a course off over time.
 *
 * The flow crosses every ownership seam: checkout snapshots a fixed schedule,
 * the captured first cycle creates the plan, the enroll worker opens access,
 * and two later provider-confirmed cycle transactions advance then complete the
 * plan. Replaying the final settlement proves the non-idempotent ledger cannot
 * advance twice.
 */
describe("a learner pays a course off over time",
    () => {
        const RAW_PRICE_VND = 1_000_000
        const CART_PRICE_VND = 10_000
        const MONTHS = 3

        let world: FlowWorld
        let commandBus: CommandBus
        let enrollStep: EnrollStepService
        let installmentPlanService: InstallmentPlanService
        let enqueueEnrollFacade: {
            enqueueForTransaction: jest.Mock
        }
        let realEnqueueEnroll: EnqueueEnrollJobService
        let sepayClient: {
            checkout: {
                initCheckoutUrl: jest.Mock
                initOneTimePaymentFields: jest.Mock
            }
            order: {
                retrieve: jest.Mock
            }
        }
        let learnerId: string
        let courseId: string
        let originTransactionId: string
        let originReferenceId: string
        let planId: string
        let secondCycleTransactionId: string
        let finalCycleTransactionId: string

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
            enqueueEnrollFacade = {
                enqueueForTransaction: jest.fn(async (params: unknown) =>
                    realEnqueueEnroll.enqueueForTransaction(params as never)),
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
                    PayNextInstallmentHandler,
                    EnrollStepService,
                    TransactionActionService,
                    CourseStatsProjectionService,
                    UserService,
                    VoucherService,
                    AiEntitlementService,
                    DayjsService,
                    RetryService,
                    {
                        provide: SEPAY,
                        useValue: sepayClient,
                    },
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
                        useValue: enqueueEnrollFacade,
                    },
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
            installmentPlanService = world.app.get(InstallmentPlanService)

            realEnqueueEnroll = new EnqueueEnrollJobService(
                {
                } as never,
                {
                } as never,
                {
                } as never,
                {
                } as never,
                world.entityManager,
                installmentPlanService,
            )
            jest.spyOn(realEnqueueEnroll,
                "enqueue").mockResolvedValue({
                    id: "installment-enroll-job",
                } as never)

            await world.truncate(
                "installment_plans",
                "transaction_items",
                "transactions",
                "enrollments",
                "pricing_phases",
                "courses",
                "users",
            )
            const learner = await world.mintLearner("installment-plan")
            learnerId = learner.id
            const course = await world.entityManager.save(
                world.entityManager.create(CourseEntity,
                    {
                        title: "Installment mastery",
                        displayId: "installment-plan-flow",
                        description: "integration fixture course",
                        originalPrice: RAW_PRICE_VND,
                        defaultLocale: Locale.En,
                    }),
            )
            courseId = course.id
            await world.entityManager.save(
                world.entityManager.create(PricingPhaseEntity,
                    {
                        course,
                        phase: PricingPhase.EarlyBird,
                        price: RAW_PRICE_VND,
                    }),
            )
        })

        afterAll(async () => {
            await world?.close()
        })

        it("checks out only the first cycle and snapshots the whole fixed schedule",
            async () => {
                const learner = await world.entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: learnerId,
                        },
                    })
                const expected = installmentPlanService.computeInstallmentTotal(
                    CART_PRICE_VND,
                    MONTHS,
                )
                const checkout = await commandBus.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [courseId],
                            paymentType: PaymentType.Sepay,
                            installmentMonths: MONTHS,
                        },
                        user: learner,
                    }),
                )
                originTransactionId = checkout.transactionId
                const origin = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: originTransactionId,
                        },
                    })
                originReferenceId = origin.referenceId

                expect(origin.status).toBe(TransactionStatus.Pending)
                expect(origin.amount).toBe(expected.monthlyAmountVnd)
                expect(origin.installmentMonths).toBe(MONTHS)
                expect(origin.installmentTotalVnd).toBe(expected.totalAmountVnd)
            })

        it("creates the plan after the provider captures the first cycle",
            async () => {
                const origin = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: originTransactionId,
                        },
                    })
                sepayClient.order.retrieve.mockResolvedValue({
                    data: {
                        data: {
                            order_invoice_number: originReferenceId,
                            order_amount: String(origin.amount),
                            order_status: "CAPTURED",
                        },
                    },
                })

                await commandBus.execute(
                    new SepayWebhookCommand({
                        order: {
                            order_invoice_number: originReferenceId,
                            order_amount: String(origin.amount),
                            order_status: "CAPTURED",
                        },
                    }),
                )

                const plan = await world.entityManager.findOneOrFail(InstallmentPlanEntity,
                    {
                        where: {
                            originTransaction: {
                                id: originTransactionId,
                            },
                        },
                    })
                planId = plan.id
                expect(plan.installmentsPaid).toBe(1)
                expect(plan.status).toBe(InstallmentPlanStatus.Active)
                expect(plan.lockedCourseIds).toEqual([courseId])
                expect(realEnqueueEnroll.enqueue).toHaveBeenCalledWith({
                    userId: learnerId,
                    courseId,
                    transactionId: originTransactionId,
                })
            })

        it("opens course access when the first-cycle enrollment job runs",
            async () => {
                await enrollStep.process({
                    payload: {
                        userId: learnerId,
                        courseId,
                        transactionId: originTransactionId,
                    },
                    queueName: "enroll",
                    job: {
                        id: "installment-enroll-job",
                    },
                    extended: undefined,
                } as never)

                const enrollment = await world.entityManager.findOneOrFail(EnrollmentEntity,
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
                expect(enrollment.isEnrolled).toBe(true)
                const origin = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: originTransactionId,
                        },
                    })
                expect(origin.status).toBe(TransactionStatus.Succeeded)
            })

        it("pays the second cycle and advances the schedule once",
            async () => {
                const learner = await world.entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: learnerId,
                        },
                    })
                const checkout = await commandBus.execute(
                    new PayNextInstallmentCommand({
                        request: {
                            planId,
                            paymentType: PaymentType.Sepay,
                        },
                        user: learner,
                    }),
                )
                secondCycleTransactionId = checkout.transactionId
                expect(await installmentPlanService.applyPaymentForTransaction({
                    transactionId: secondCycleTransactionId,
                    planId,
                    paidAmountVnd: checkout.amount,
                })).toBe(true)

                const plan = await world.entityManager.findOneByOrFail(InstallmentPlanEntity,
                    {
                        id: planId,
                    })
                expect(plan.installmentsPaid).toBe(2)
                expect(plan.status).toBe(InstallmentPlanStatus.Active)
            })

        it("pays the final cycle, closes the plan, and keeps access open",
            async () => {
                const learner = await world.entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: learnerId,
                        },
                    })
                const checkout = await commandBus.execute(
                    new PayNextInstallmentCommand({
                        request: {
                            planId,
                            paymentType: PaymentType.Sepay,
                        },
                        user: learner,
                    }),
                )
                finalCycleTransactionId = checkout.transactionId
                expect(await installmentPlanService.applyPaymentForTransaction({
                    transactionId: finalCycleTransactionId,
                    planId,
                    paidAmountVnd: checkout.amount,
                })).toBe(true)

                const plan = await world.entityManager.findOneByOrFail(InstallmentPlanEntity,
                    {
                        id: planId,
                    })
                expect(plan.installmentsPaid).toBe(MONTHS)
                expect(plan.status).toBe(InstallmentPlanStatus.Completed)
                const enrollment = await world.entityManager.findOneOrFail(EnrollmentEntity,
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
                expect(enrollment.isEnrolled).toBe(true)
            })

        it("ignores a duplicate settlement for the final cycle",
            async () => {
                const finalTransaction = await world.entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: finalCycleTransactionId,
                        },
                    })
                expect(await installmentPlanService.applyPaymentForTransaction({
                    transactionId: finalCycleTransactionId,
                    planId,
                    paidAmountVnd: finalTransaction.amount,
                })).toBe(false)

                const plan = await world.entityManager.findOneByOrFail(InstallmentPlanEntity,
                    {
                        id: planId,
                    })
                expect(plan.installmentsPaid).toBe(MONTHS)
                expect(plan.status).toBe(InstallmentPlanStatus.Completed)
                expect(secondCycleTransactionId).not.toBe(finalCycleTransactionId)
            })
    })
