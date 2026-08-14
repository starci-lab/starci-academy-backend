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
    CourseVoucherEntity,
} from "@modules/databases/postgresql/primary/entities/course-voucher.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    PricingPhaseEntity,
} from "@modules/databases/postgresql/primary/entities/pricing-phase.entity"
import {
    RewardRedemptionEntity,
} from "@modules/databases/postgresql/primary/entities/reward-redemption.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
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
    RewardRedemptionStatus,
} from "@modules/databases/postgresql/primary/enums/reward-redemption-status"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    VoucherDiscountType,
} from "@modules/databases/postgresql/primary/enums/voucher-discount-type"
import {
    VoucherStatus,
} from "@modules/databases/postgresql/primary/enums/voucher-status"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    CourseAlreadyEnrolledException,
} from "@modules/platform/exceptions/errors/courses/course-already-enrolled"
import {
    InstallmentCurrencyNotSupportedException,
} from "@modules/platform/exceptions/errors/payment/installment-currency-not-supported"
import {
    MissingUsdPriceException,
} from "@modules/platform/exceptions/errors/payment/missing-usd-price"
import {
    VoucherNotSupportedForGatewayException,
} from "@modules/platform/exceptions/errors/payment/voucher-not-supported-for-gateway"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
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
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
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
    CourseEnrollHandler,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll.handler"
import {
    CourseEnrollCommand,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll.command"
import {
    CourseEnrollPayOsService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll-payos.service"
import {
    CourseEnrollSepayService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll-sepay.service"
import {
    CourseEnrollStripeService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll-stripe.service"
import {
    CourseEnrollPaypalService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll-paypal.service"
import {
    CourseEnrollCryptoService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll-crypto.service"
import {
    CoursePricingService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-pricing.service"
import type {
    CourseEnrollRequest,
} from "@features/api/core/graphql/mutations/courses/course-enroll/graphql-types/request"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Integration coverage for every `courses/course-enroll` gateway branch.
 * findings: none of the 5 per-provider services (PayOS/Sepay/Stripe/PayPal/Crypto) nor the
 * handler's cross-cutting guards (already-enrolled, installment/voucher capability) had
 * coverage against a REAL Postgres -- only the handler's routing was unit-tested against a
 * mocked entity manager and mocked provider sub-services
 * (`course-enroll.handler.spec.ts`). This spec drives the real
 * {@link CourseEnrollHandler} with every real sub-service + real pricing/loyalty/voucher
 * stack against Testcontainers Postgres, asserting the persisted `Pending` `TransactionEntity`
 * row (amount, discount, installment snapshot) and the gateway SDK call shape.
 *
 * MOCKED (genuinely external -- never hit the network in a test):
 *  - The 5 gateway SDK clients (SePay/PayOS/Stripe/PayPal/Crypto) -- `checkout`/`paymentRequests`/
 *    `sessions`/`createOrder`/`createInvoice` calls are jest-backed and asserted, never real HTTP.
 *  - `EnqueueReconcileTransactionJobService` -- the delayed reconcile-poll hand-off (mirrors the
 *    `sepay-webhook.e2e-spec.ts` pattern for the enroll-job queue).
 *
 * REAL: Postgres (Testcontainers), `CourseEnrollHandler`, all 5 provider services,
 * `CoursePricingService`, `LoyaltyDiscountService` (+ its two projection services),
 * `VoucherService`, `InstallmentPlanService`, `DayjsService`, `RetryService` -- the entire
 * pricing/capability/persistence stack production wires.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Course enroll — all gateways (integration)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let handler: CourseEnrollHandler
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
        /** Charged VND after `CoursePricingService`'s non-production /100 test divisor, 0% discount. */
        const CHARGED_VND_NO_DISCOUNT = 10_000
        /** Raw EarlyBird USD tier price seeded for the international-gateway fixtures. */
        const EARLYBIRD_PRICE_USD = 49
        /** `roundUsdToCharm(49)`: ceil(49) - 0.01. */
        const CHARGED_USD_NO_DISCOUNT = 48.99

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
                    TestHelpersModule,
                    // real Postgres against the Testcontainers DB -- no hydration/
                    // resolvers/seeders, this focused module doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the handler + every per-gateway service under test
                    CourseEnrollHandler,
                    CourseEnrollPayOsService,
                    CourseEnrollSepayService,
                    CourseEnrollStripeService,
                    CourseEnrollPaypalService,
                    CourseEnrollCryptoService,
                    // REAL -- the whole pricing/loyalty/voucher/installment stack, so the
                    // amounts asserted are exactly what production computes, not a stub echo
                    CoursePricingService,
                    LoyaltyDiscountService,
                    UserStatsProjectionService,
                    UserXpProjectionService,
                    VoucherService,
                    InstallmentPlanService,
                    DayjsService,
                    RetryService,
                    // mocked -- genuinely external SDK clients / the async queue hand-off
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
            handler = app.get(CourseEnrollHandler)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"course_vouchers\", \"reward_redemptions\", \"transactions\", "
                + "\"enrollments\", \"pricing_phases\", \"courses\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (
            referenceId: string,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${referenceId}`,
                    }),
            )

        /**
         * Seed a fixture course with ONE EarlyBird `PricingPhaseEntity` row (the tier every
         * gateway service charges by default -- no `metadata` relation loaded means
         * `CoursePricingService.getCurrentPricingPhase` falls back to EarlyBird).
         */
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
                        description: "integration fixture course",
                        // Regular-tier list price -- unused by these tests (EarlyBird is charged)
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

        /** The minimal enroll request every test starts from; callers override fields. */
        const buildRequest = (
            overrides: Partial<CourseEnrollRequest> & Pick<CourseEnrollRequest, "courseId" | "paymentType">,
        ): CourseEnrollRequest => ({
            payosReturnUrl: "https://academy.test/return",
            payosCancelUrl: "https://academy.test/cancel",
            ...overrides,
        })

        describe("PayOS (VND, domestic)",
            () => {
                it("creates a Pending transaction priced from the EarlyBird tier and calls the real link API",
                    async () => {
                        const user = await seedUser("payos-1")
                        const course = await seedCourse("payos-course-1")
                        payosClient.paymentRequests.create.mockResolvedValueOnce({
                            orderCode: 111,
                            amount: CHARGED_VND_NO_DISCOUNT,
                            checkoutUrl: "https://payos.test/checkout/111",
                        })

                        const result = await handler.execute(
                            new CourseEnrollCommand({
                                request: buildRequest({
                                    courseId: course.id,
                                    paymentType: PaymentType.PayOS,
                                }),
                                user,
                            }),
                        )

                        expect(payosClient.paymentRequests.create).toHaveBeenCalledWith(
                            expect.objectContaining({
                                amount: CHARGED_VND_NO_DISCOUNT,
                            }),
                        )
                        expect(result.transactionId).toBeDefined()
                        expect(result.amount).toBe(CHARGED_VND_NO_DISCOUNT)

                        const transaction = await entityManager.findOneOrFail(
                            TransactionEntity,
                            {
                                where: {
                                    id: result.transactionId,
                                },
                            },
                        )
                        expect(transaction.status).toBe(TransactionStatus.Pending)
                        expect(transaction.paymentType).toBe(PaymentType.PayOS)
                        expect(transaction.amount).toBe(CHARGED_VND_NO_DISCOUNT)
                        expect(transaction.discountPercent).toBe(0)
                        expect(transaction.checkoutUrl).toBe("https://payos.test/checkout/111")
                        expect(transaction.pricingPhase).toBe(PricingPhase.EarlyBird)
                    })
            })

        describe("Sepay (VND, domestic, local HMAC signing)",
            () => {
                it("creates a Pending transaction and signs checkout fields without any network call",
                    async () => {
                        const user = await seedUser("sepay-1")
                        const course = await seedCourse("sepay-course-1")

                        const result = await handler.execute(
                            new CourseEnrollCommand({
                                request: buildRequest({
                                    courseId: course.id,
                                    paymentType: PaymentType.Sepay,
                                }),
                                user,
                            }),
                        )

                        expect(sepayClient.checkout.initOneTimePaymentFields)
                            .toHaveBeenCalledWith(
                                expect.objectContaining({
                                    order_amount: CHARGED_VND_NO_DISCOUNT,
                                    currency: "VND",
                                }),
                            )
                        expect(result.checkoutFields).toBeDefined()
                        expect(result.amount).toBe(CHARGED_VND_NO_DISCOUNT)

                        const transaction = await entityManager.findOneOrFail(
                            TransactionEntity,
                            {
                                where: {
                                    id: result.transactionId,
                                },
                            },
                        )
                        expect(transaction.status).toBe(TransactionStatus.Pending)
                        expect(transaction.paymentType).toBe(PaymentType.Sepay)
                        expect(transaction.amount).toBe(CHARGED_VND_NO_DISCOUNT)
                    })

                it("installment (3 months): charges only the first cycle and snapshots the whole schedule",
                    async () => {
                        const user = await seedUser("sepay-installment")
                        const course = await seedCourse("sepay-course-installment")

                        const result = await handler.execute(
                            new CourseEnrollCommand({
                                request: buildRequest({
                                    courseId: course.id,
                                    paymentType: PaymentType.Sepay,
                                    installmentMonths: 3,
                                }),
                                user,
                            }),
                        )

                        // markup 10% (env default) on the 10,000₫ base -> 11,000 total,
                        // split over 3 cycles -> round(11000/3) = 3667 charged now
                        const expectedTotalVnd = 11_000
                        const expectedMonthlyVnd = 3_667
                        expect(result.amount).toBe(expectedMonthlyVnd)

                        const transaction = await entityManager.findOneOrFail(
                            TransactionEntity,
                            {
                                where: {
                                    id: result.transactionId,
                                },
                            },
                        )
                        expect(transaction.amount).toBe(expectedMonthlyVnd)
                        expect(transaction.installmentMonths).toBe(3)
                        expect(transaction.installmentMarkupPercent).toBe(10)
                        expect(transaction.installmentTotalVnd).toBe(expectedTotalVnd)
                    })
            })

        describe("Stripe (USD, international)",
            () => {
                it("charges the explicit USD tier price (not VND) via a hosted Checkout Session",
                    async () => {
                        const user = await seedUser("stripe-1")
                        const course = await seedCourse("stripe-course-1",
                            {
                                priceUsd: EARLYBIRD_PRICE_USD,
                            })
                        stripeClient.checkout.sessions.create.mockResolvedValueOnce({
                            id: "cs_test_123",
                            url: "https://checkout.stripe.test/cs_test_123",
                        })

                        const result = await handler.execute(
                            new CourseEnrollCommand({
                                request: buildRequest({
                                    courseId: course.id,
                                    paymentType: PaymentType.Stripe,
                                }),
                                user,
                            }),
                        )

                        // Stripe charges cents: USD dollars x 100
                        expect(stripeClient.checkout.sessions.create).toHaveBeenCalledWith(
                            expect.objectContaining({
                                line_items: [
                                    expect.objectContaining({
                                        price_data: expect.objectContaining({
                                            unit_amount: Math.round(CHARGED_USD_NO_DISCOUNT * 100),
                                        }),
                                    }),
                                ],
                            }),
                        )
                        // the persisted VND amount stays the stable VND reference, NOT the USD charge
                        expect(result.amount).toBe(CHARGED_VND_NO_DISCOUNT)

                        const transaction = await entityManager.findOneOrFail(
                            TransactionEntity,
                            {
                                where: {
                                    id: result.transactionId,
                                },
                            },
                        )
                        expect(transaction.paymentType).toBe(PaymentType.Stripe)
                        expect(transaction.providerPaymentId).toBe("cs_test_123")
                        expect(transaction.checkoutUrl).toBe("https://checkout.stripe.test/cs_test_123")
                    })

                it("rejects (before any row or session) when the course has no USD price configured",
                    async () => {
                        const user = await seedUser("stripe-no-usd")
                        // no priceUsd on this course's EarlyBird phase
                        const course = await seedCourse("stripe-course-no-usd")

                        await expect(
                            handler.execute(
                                new CourseEnrollCommand({
                                    request: buildRequest({
                                        courseId: course.id,
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

                it("rejects installments on a USD gateway before creating anything",
                    async () => {
                        const user = await seedUser("stripe-installment-reject")
                        const course = await seedCourse("stripe-course-installment-reject",
                            {
                                priceUsd: EARLYBIRD_PRICE_USD,
                            })

                        await expect(
                            handler.execute(
                                new CourseEnrollCommand({
                                    request: buildRequest({
                                        courseId: course.id,
                                        paymentType: PaymentType.Stripe,
                                        installmentMonths: 3,
                                    }),
                                    user,
                                }),
                            ),
                        ).rejects.toThrow(InstallmentCurrencyNotSupportedException)

                        expect(stripeClient.checkout.sessions.create).not.toHaveBeenCalled()
                        const count = await entityManager.count(TransactionEntity)
                        expect(count).toBe(0)
                    })
            })

        describe("PayPal (USD, international)",
            () => {
                it("creates a Pending transaction via a PayPal order and stores the native order id",
                    async () => {
                        const user = await seedUser("paypal-1")
                        const course = await seedCourse("paypal-course-1",
                            {
                                priceUsd: EARLYBIRD_PRICE_USD,
                            })
                        paypalClient.createOrder.mockResolvedValueOnce({
                            orderId: "PAYPAL-ORDER-1",
                            approveUrl: "https://paypal.test/approve/1",
                        })

                        const result = await handler.execute(
                            new CourseEnrollCommand({
                                request: buildRequest({
                                    courseId: course.id,
                                    paymentType: PaymentType.Paypal,
                                }),
                                user,
                            }),
                        )

                        expect(paypalClient.createOrder).toHaveBeenCalledWith(
                            expect.objectContaining({
                                amount: CHARGED_USD_NO_DISCOUNT,
                            }),
                        )
                        const transaction = await entityManager.findOneOrFail(
                            TransactionEntity,
                            {
                                where: {
                                    id: result.transactionId,
                                },
                            },
                        )
                        expect(transaction.paymentType).toBe(PaymentType.Paypal)
                        expect(transaction.providerPaymentId).toBe("PAYPAL-ORDER-1")
                        expect(transaction.checkoutUrl).toBe("https://paypal.test/approve/1")
                    })
            })

        describe("Crypto / NOWPayments (USD, international)",
            () => {
                it("creates a Pending transaction via a hosted invoice and stores the native invoice id",
                    async () => {
                        const user = await seedUser("crypto-1")
                        const course = await seedCourse("crypto-course-1",
                            {
                                priceUsd: EARLYBIRD_PRICE_USD,
                            })
                        nowPaymentsClient.createInvoice.mockResolvedValueOnce({
                            invoiceId: "NOWPAY-INV-1",
                            invoiceUrl: "https://nowpayments.test/invoice/1",
                        })

                        const result = await handler.execute(
                            new CourseEnrollCommand({
                                request: buildRequest({
                                    courseId: course.id,
                                    paymentType: PaymentType.Crypto,
                                }),
                                user,
                            }),
                        )

                        expect(nowPaymentsClient.createInvoice).toHaveBeenCalledWith(
                            expect.objectContaining({
                                amount: CHARGED_USD_NO_DISCOUNT,
                            }),
                        )
                        const transaction = await entityManager.findOneOrFail(
                            TransactionEntity,
                            {
                                where: {
                                    id: result.transactionId,
                                },
                            },
                        )
                        expect(transaction.paymentType).toBe(PaymentType.Crypto)
                        expect(transaction.providerPaymentId).toBe("NOWPAY-INV-1")
                        expect(transaction.checkoutUrl).toBe("https://nowpayments.test/invoice/1")
                    })
            })

        describe("cross-cutting handler guards (real DB)",
            () => {
                it("already enrolled: rejects loud and writes no transaction row",
                    async () => {
                        const user = await seedUser("already-enrolled")
                        const course = await seedCourse("already-enrolled-course")
                        await entityManager.save(
                            entityManager.create(EnrollmentEntity,
                                {
                                    user,
                                    course,
                                    pricingPhase: PricingPhase.EarlyBird,
                                    isEnrolled: true,
                                }),
                        )

                        await expect(
                            handler.execute(
                                new CourseEnrollCommand({
                                    request: buildRequest({
                                        courseId: course.id,
                                        paymentType: PaymentType.PayOS,
                                    }),
                                    user,
                                }),
                            ),
                        ).rejects.toThrow(CourseAlreadyEnrolledException)

                        expect(payosClient.paymentRequests.create).not.toHaveBeenCalled()
                        const count = await entityManager.count(TransactionEntity)
                        expect(count).toBe(0)
                    })

                it("loyalty: 2 already-owned courses lower the charged VND amount by 10%",
                    async () => {
                        const user = await seedUser("loyalty")
                        // 2 OTHER paid enrollments (not the course being bought) -> +5% each = 10%
                        const owned1 = await seedCourse("loyalty-owned-1")
                        const owned2 = await seedCourse("loyalty-owned-2")
                        await entityManager.save([
                            entityManager.create(EnrollmentEntity,
                                {
                                    user,
                                    course: owned1,
                                    pricingPhase: PricingPhase.EarlyBird,
                                    isEnrolled: true,
                                }),
                            entityManager.create(EnrollmentEntity,
                                {
                                    user,
                                    course: owned2,
                                    pricingPhase: PricingPhase.EarlyBird,
                                    isEnrolled: true,
                                }),
                        ])
                        const course = await seedCourse("loyalty-target-course")
                        payosClient.paymentRequests.create.mockResolvedValueOnce({
                            orderCode: 222,
                            // round(1,000,000 * 0.9 / 100) = 9,000
                            amount: 9_000,
                            checkoutUrl: "https://payos.test/checkout/222",
                        })

                        const result = await handler.execute(
                            new CourseEnrollCommand({
                                request: buildRequest({
                                    courseId: course.id,
                                    paymentType: PaymentType.PayOS,
                                }),
                                user,
                            }),
                        )

                        expect(payosClient.paymentRequests.create).toHaveBeenCalledWith(
                            expect.objectContaining({
                                amount: 9_000,
                            }),
                        )
                        const transaction = await entityManager.findOneOrFail(
                            TransactionEntity,
                            {
                                where: {
                                    id: result.transactionId,
                                },
                            },
                        )
                        expect(transaction.discountPercent).toBe(10)
                        expect(transaction.amount).toBe(9_000)
                    })

                it("Percent voucher is honoured on a USD gateway and reserved against the transaction",
                    async () => {
                        const user = await seedUser("voucher-percent")
                        const course = await seedCourse("voucher-percent-course",
                            {
                                priceUsd: EARLYBIRD_PRICE_USD,
                            })
                        const redemption = await entityManager.save(
                            entityManager.create(RewardRedemptionEntity,
                                {
                                    user,
                                    rewardKey: "voucher10",
                                    cost: 800,
                                    status: RewardRedemptionStatus.Granted,
                                    metadata: null,
                                }),
                        )
                        const voucher = await entityManager.save(
                            entityManager.create(CourseVoucherEntity,
                                {
                                    user,
                                    redemption,
                                    course: null,
                                    code: "PCT10-TEST",
                                    discountType: VoucherDiscountType.Percent,
                                    value: 20,
                                    status: VoucherStatus.Unused,
                                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
                                }),
                        )
                        paypalClient.createOrder.mockResolvedValueOnce({
                            orderId: "PAYPAL-VOUCHER-1",
                            approveUrl: "https://paypal.test/approve/voucher",
                        })

                        const result = await handler.execute(
                            new CourseEnrollCommand({
                                request: buildRequest({
                                    courseId: course.id,
                                    paymentType: PaymentType.Paypal,
                                    voucherCode: voucher.code,
                                }),
                                user,
                            }),
                        )

                        // VoucherService.applyToAmount ROUNDS to the nearest whole dollar:
                        // Math.round(48.99 * (1 - 20/100)) = Math.round(39.192) = 39
                        const expectedDiscountedUsd = 39
                        expect(paypalClient.createOrder).toHaveBeenCalledWith(
                            expect.objectContaining({
                                amount: expectedDiscountedUsd,
                            }),
                        )

                        const reservedVoucher = await entityManager.findOneOrFail(
                            CourseVoucherEntity,
                            {
                                where: {
                                    id: voucher.id,
                                },
                            },
                        )
                        expect(reservedVoucher.status).toBe(VoucherStatus.Reserved)
                        expect(reservedVoucher.reservedTransactionId).toBe(result.transactionId)

                        const transaction = await entityManager.findOneOrFail(
                            TransactionEntity,
                            {
                                where: {
                                    id: result.transactionId,
                                },
                            },
                        )
                        expect(transaction.voucherCode).toBe(voucher.code)
                    })

                it("Flat voucher on a USD gateway rejects before creating anything (currency-bound)",
                    async () => {
                        const user = await seedUser("voucher-flat-reject")
                        const course = await seedCourse("voucher-flat-course",
                            {
                                priceUsd: EARLYBIRD_PRICE_USD,
                            })
                        const redemption = await entityManager.save(
                            entityManager.create(RewardRedemptionEntity,
                                {
                                    user,
                                    rewardKey: "voucherFlat",
                                    cost: 500,
                                    status: RewardRedemptionStatus.Granted,
                                    metadata: null,
                                }),
                        )
                        const voucher = await entityManager.save(
                            entityManager.create(CourseVoucherEntity,
                                {
                                    user,
                                    redemption,
                                    course: null,
                                    code: "FLAT50K-TEST",
                                    discountType: VoucherDiscountType.Flat,
                                    value: 50_000,
                                    status: VoucherStatus.Unused,
                                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
                                }),
                        )

                        await expect(
                            handler.execute(
                                new CourseEnrollCommand({
                                    request: buildRequest({
                                        courseId: course.id,
                                        paymentType: PaymentType.Stripe,
                                        voucherCode: voucher.code,
                                    }),
                                    user,
                                }),
                            ),
                        ).rejects.toThrow(VoucherNotSupportedForGatewayException)

                        expect(stripeClient.checkout.sessions.create).not.toHaveBeenCalled()
                        const count = await entityManager.count(TransactionEntity)
                        expect(count).toBe(0)
                        // the voucher was never reserved -- still spendable elsewhere
                        const untouchedVoucher = await entityManager.findOneOrFail(
                            CourseVoucherEntity,
                            {
                                where: {
                                    id: voucher.id,
                                },
                            },
                        )
                        expect(untouchedVoucher.status).toBe(VoucherStatus.Unused)
                    })
            })
    })
