import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseEntity,
    EnrollmentEntity,
    Locale,
    PaymentType,
    PricingPhase,
    PricingPhaseEntity,
    PrimaryPostgreSQLModule,
    TransactionEntity,
    TransactionItemEntity,
    TransactionStatus,
    UserEntity,
} from "@modules/databases"
import {
    CoursesCheckoutEmptyException,
    MissingUsdPriceException,
} from "@modules/exceptions"
import {
    EnqueueReconcileTransactionJobService,
    InstallmentPlanService,
    LoyaltyDiscountService,
    UserStatsProjectionService,
    UserXpProjectionService,
} from "@modules/bussiness"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"
import {
    SEPAY,
} from "@modules/sepay/constants"
import {
    PAYOS,
} from "@modules/payos/constants"
import {
    STRIPE,
} from "@modules/stripe/constants"
import {
    PaypalClient,
} from "@modules/paypal"
import {
    NowPaymentsClient,
} from "@modules/nowpayments"
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
import type {
    CoursesCheckoutRequest,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/graphql-types"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the multi-course cart checkout (`courses/courses-checkout`) — no e2e
 * previously exercised `CoursesCheckoutHandler` against a real Postgres: the ONE
 * `transactions` order row (`course: null`) + one `TransactionItemEntity` per
 * course, the progressive-loyalty + bundle-bonus pricing
 * (`CoursesCheckoutPricingService`), and the already-owned-courses-are-dropped
 * rule were all uncovered outside the pure-pricing unit spec
 * (`courses-checkout-pricing.service.spec.ts`, which never touches a DB or the
 * handler's persistence).
 *
 * MOCKED (genuinely external): the 5 gateway SDK clients + the reconcile-job
 * queue — same shape as `course-enroll.e2e-spec.ts`.
 *
 * REAL: Postgres (Testcontainers), `CoursesCheckoutHandler`,
 * `CoursesCheckoutPricingService`, `CoursePricingService`,
 * `LoyaltyDiscountService` (+ its two projection services),
 * `InstallmentPlanService`, `RetryService`.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Courses checkout — multi-course cart (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let handler: CoursesCheckoutHandler
        let payosClient: {
            paymentRequests: {
                create: jest.Mock
            }
        }
        let sepayClient: {
            checkout: {
                initCheckoutUrl: jest.Mock
                initOneTimePaymentFields: jest.Mock
            }
        }
        let stripeClient: {
            checkout: {
                sessions: {
                    create: jest.Mock
                }
            }
        }
        let paypalClient: {
            createOrder: jest.Mock
        }
        let nowPaymentsClient: {
            createInvoice: jest.Mock
        }
        let enqueueReconcileTransactionJob: {
            enqueue: jest.Mock
        }

        /** Raw EarlyBird VND tier price seeded on every fixture course (pre non-prod /100 divisor). */
        const EARLYBIRD_PRICE_VND = 1_000_000
        const EARLYBIRD_PRICE_USD = 49

        beforeAll(async () => {
            payosClient = {
                paymentRequests: {
                    create: jest.fn(),
                },
            }
            sepayClient = {
                checkout: {
                    initCheckoutUrl: jest.fn(() => "https://sepay.test/checkout"),
                    initOneTimePaymentFields: jest.fn((fields: unknown) => fields),
                },
            }
            stripeClient = {
                checkout: {
                    sessions: {
                        create: jest.fn(),
                    },
                },
            }
            paypalClient = {
                createOrder: jest.fn(),
            }
            nowPaymentsClient = {
                createInvoice: jest.fn(),
            }
            enqueueReconcileTransactionJob = {
                enqueue: jest.fn(),
            }

            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    CoursesCheckoutHandler,
                    CoursesCheckoutPricingService,
                    CoursePricingService,
                    LoyaltyDiscountService,
                    UserStatsProjectionService,
                    UserXpProjectionService,
                    InstallmentPlanService,
                    DayjsService,
                    RetryService,
                    {
                        provide: SEPAY,
                        useValue: sepayClient,
                    },
                    {
                        provide: PAYOS,
                        useValue: payosClient,
                    },
                    {
                        provide: STRIPE,
                        useValue: stripeClient,
                    },
                    {
                        provide: PaypalClient,
                        useValue: paypalClient,
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: nowPaymentsClient,
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcileTransactionJob,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            handler = app.get(CoursesCheckoutHandler)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"transaction_items\", \"transactions\", \"enrollments\", "
                + "\"pricing_phases\", \"courses\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        const seedUser = async (
            referenceId: string,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${referenceId}`,
                    }),
            )

        const seedCourse = async (
            displayId: string,
            {
                priceVnd = EARLYBIRD_PRICE_VND,
                priceUsd = null,
            }: { priceVnd?: number, priceUsd?: number | null } = {
            },
        ): Promise<CourseEntity> => {
            const course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId,
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            await entityManager.save(
                entityManager.create(PricingPhaseEntity,
                    {
                        course,
                        phase: PricingPhase.EarlyBird,
                        price: priceVnd,
                        priceUsd,
                    }),
            )
            return course
        }

        const buildRequest = (
            overrides: Partial<CoursesCheckoutRequest> & Pick<CoursesCheckoutRequest, "courseIds" | "paymentType">,
        ): CoursesCheckoutRequest => ({
            returnUrl: "https://academy.test/return",
            cancelUrl: "https://academy.test/cancel",
            ...overrides,
        })

        it("2-course cart (PayOS/VND): progressive loyalty + bundle bonus, one order + one item row per course",
            async () => {
                const user = await seedUser("cart-2")
                const courseA = await seedCourse("cart-course-a")
                const courseB = await seedCourse("cart-course-b")
                // line0: 0% loyalty + 5% bundle(2) = 5% -> round(1,000,000*0.95)=950,000 -> /100=9,500
                // line1: 5% loyalty (progressive, pretends line0 already owned) + 5% bundle = 10%
                //        -> round(1,000,000*0.90)=900,000 -> /100=9,000
                const expectedTotalVnd = 18_500
                payosClient.paymentRequests.create.mockResolvedValueOnce({
                    orderCode: 333,
                    amount: expectedTotalVnd,
                    checkoutUrl: "https://payos.test/checkout/333",
                })

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: buildRequest({
                            courseIds: [
                                courseA.id,
                                courseB.id,
                            ],
                            paymentType: PaymentType.PayOS,
                        }),
                        user,
                    }),
                )

                expect(payosClient.paymentRequests.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: expectedTotalVnd,
                    }),
                )
                expect(result.itemCount).toBe(2)
                expect(result.amount).toBe(expectedTotalVnd)

                const order = await entityManager.findOneOrFail(
                    TransactionEntity,
                    {
                        where: {
                            id: result.transactionId,
                        },
                    },
                )
                expect(order.status).toBe(TransactionStatus.Pending)
                expect(order.course).toBeNull()
                expect(order.amount).toBe(expectedTotalVnd)

                const items = await entityManager.find(
                    TransactionItemEntity,
                    {
                        where: {
                            transaction: {
                                id: result.transactionId,
                            },
                        },
                        order: {
                            amount: "DESC",
                        },
                    },
                )
                expect(items).toHaveLength(2)
                expect(items[0].amount).toBe(9_500)
                expect(items[0].discountPercent).toBe(5)
                expect(items[1].amount).toBe(9_000)
                expect(items[1].discountPercent).toBe(10)
                // both lines sum to the order total
                expect(items[0].amount + items[1].amount).toBe(expectedTotalVnd)
            })

        it("drops already-owned courses from the cart — only the unowned course gets an item row",
            async () => {
                const user = await seedUser("cart-owned")
                const owned = await seedCourse("cart-owned-course")
                const unowned = await seedCourse("cart-unowned-course")
                await entityManager.save(
                    entityManager.create(EnrollmentEntity,
                        {
                            user,
                            course: owned,
                            pricingPhase: PricingPhase.EarlyBird,
                            isEnrolled: true,
                        }),
                )
                // 1 owned course -> +5% loyalty; single purchasable line -> 0% bundle
                // round(1,000,000 * 0.95) = 950,000 -> /100 = 9,500
                const expectedAmount = 9_500
                payosClient.paymentRequests.create.mockResolvedValueOnce({
                    orderCode: 444,
                    amount: expectedAmount,
                    checkoutUrl: "https://payos.test/checkout/444",
                })

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: buildRequest({
                            courseIds: [
                                owned.id,
                                unowned.id,
                            ],
                            paymentType: PaymentType.PayOS,
                        }),
                        user,
                    }),
                )

                expect(result.itemCount).toBe(1)
                const items = await entityManager.find(
                    TransactionItemEntity,
                    {
                        where: {
                            transaction: {
                                id: result.transactionId,
                            },
                        },
                    },
                )
                expect(items).toHaveLength(1)
                expect(items[0].courseId).toBe(unowned.id)
                expect(items[0].amount).toBe(expectedAmount)
                expect(items[0].discountPercent).toBe(5)
            })

        it("empty cart (nothing purchasable) rejects loud and writes no rows",
            async () => {
                const user = await seedUser("cart-empty")

                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: buildRequest({
                                courseIds: [],
                                paymentType: PaymentType.PayOS,
                            }),
                            user,
                        }),
                    ),
                ).rejects.toThrow(CoursesCheckoutEmptyException)

                expect(payosClient.paymentRequests.create).not.toHaveBeenCalled()
                const count = await entityManager.count(TransactionEntity)
                expect(count).toBe(0)
            })

        it("Stripe (USD): charges the summed USD total in cents, one order row (course=null)",
            async () => {
                const user = await seedUser("cart-stripe")
                const course = await seedCourse("cart-stripe-course",
                    {
                        priceUsd: EARLYBIRD_PRICE_USD,
                    })
                stripeClient.checkout.sessions.create.mockResolvedValueOnce({
                    id: "cs_test_cart",
                    url: "https://checkout.stripe.test/cs_test_cart",
                })

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: buildRequest({
                            courseIds: [
                                course.id,
                            ],
                            paymentType: PaymentType.Stripe,
                        }),
                        user,
                    }),
                )

                // single line, 0% discount -> roundUsdToCharm(49) = 48.99 -> 4899 cents
                expect(stripeClient.checkout.sessions.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        line_items: [
                            expect.objectContaining({
                                price_data: expect.objectContaining({
                                    unit_amount: 4_899,
                                }),
                            }),
                        ],
                    }),
                )
                const order = await entityManager.findOneOrFail(
                    TransactionEntity,
                    {
                        where: {
                            id: result.transactionId,
                        },
                    },
                )
                expect(order.providerPaymentId).toBe("cs_test_cart")
                expect(order.paymentType).toBe(PaymentType.Stripe)
            })

        it("Stripe (USD): rejects the whole order when ANY line lacks a USD price",
            async () => {
                const user = await seedUser("cart-stripe-missing-usd")
                // no priceUsd on this course
                const course = await seedCourse("cart-stripe-course-no-usd")

                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: buildRequest({
                                courseIds: [
                                    course.id,
                                ],
                                paymentType: PaymentType.Stripe,
                            }),
                            user,
                        }),
                    ),
                ).rejects.toThrow(MissingUsdPriceException)

                expect(stripeClient.checkout.sessions.create).not.toHaveBeenCalled()
                const count = await entityManager.count(TransactionEntity)
                expect(count).toBe(0)
            })
    })
