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
    KeycloakJwksService,
} from "@modules/integrations/keycloak/jwks.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
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
    CourseVoucherEntity,
} from "@modules/databases/postgresql/primary/entities/course-voucher.entity"
import {
    RewardRedemptionEntity,
} from "@modules/databases/postgresql/primary/entities/reward-redemption.entity"
import type {
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
    VoucherDiscountType,
} from "@modules/databases/postgresql/primary/enums/voucher-discount-type"
import {
    VoucherStatus,
} from "@modules/databases/postgresql/primary/enums/voucher-status"
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
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    CoursesCheckoutResolver,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.resolver"
import {
    CoursesCheckoutService,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.service"
import {
    CoursesCheckoutHandler,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.handler"
import {
    CoursesCheckoutPricingService,
} from "@features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout-pricing.service"
import {
    CoursePricingService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-pricing.service"
import {
    CourseEnrollResolver,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll.resolver"
import {
    CourseEnrollService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll.service"
import {
    CourseEnrollHandler,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-enroll.handler"
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
    LoyaltyDiscountService,
} from "@modules/bussiness/loyalty/loyalty-discount.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
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
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

describe("checkout remains single and atomic across retries and races",
    () => {
        const MUTATION = `
            mutation Checkout($request: CoursesCheckoutRequest!) {
                coursesCheckout(request: $request) {
                    success
                    error
                    data { transactionId referenceId amount itemCount }
                }
            }
        `
        const COURSE_ENROLL_MUTATION = `
            mutation Enroll($request: CourseEnrollRequest!) {
                courseEnroll(request: $request) {
                    success
                    error
                    data { transactionId referenceId amount }
                }
            }
        `
        let world: FlowWorld
        let currentUser: UserEntity | null = null
        let courseIds: Array<string> = []
        const payosCreate = jest.fn()

        const authGuard = {
            canActivate: async (context: ExecutionContext): Promise<boolean> => {
                const gql = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                if (!currentUser) {
                    return false
                }
                gql.req.user = currentUser
                return true
            },
        }

        const checkout = async () => request(world.app.getHttpServer())
            .post("/graphql")
            .send({
                query: MUTATION,
                variables: {
                    request: {
                        courseIds,
                        paymentType: PaymentType.PayOS,
                        returnUrl: "https://client.test/success",
                        cancelUrl: "https://client.test/cancel",
                    },
                },
            })

        beforeAll(async () => {
            jest.spyOn(KeycloakAuthGraphQLGuard.prototype,
                "canActivate").mockImplementation(authGuard.canActivate)
            world = await bootFlowWorld({
                imports: [ApolloServerModule.register({
                    type: ApolloServerType.Monolithic,
                    useServices: false,
                })],
                providers: [
                    CoursesCheckoutResolver,
                    CoursesCheckoutService,
                    CoursesCheckoutHandler,
                    CoursesCheckoutPricingService,
                    CoursePricingService,
                    CourseEnrollResolver,
                    CourseEnrollService,
                    CourseEnrollHandler,
                    CourseEnrollPayOsService,
                    CourseEnrollSepayService,
                    CourseEnrollStripeService,
                    CourseEnrollPaypalService,
                    CourseEnrollCryptoService,
                    LoyaltyDiscountService,
                    VoucherService,
                    UserStatsProjectionService,
                    UserXpProjectionService,
                    InstallmentPlanService,
                    DayjsService,
                    RetryService,
                    {
                        provide: PAYOS,
                        useValue: {
                            paymentRequests: {
                                create: payosCreate
                            }
                        },
                    },
                    {
                        provide: SEPAY,
                        useValue: {
                            checkout: {
                                initCheckoutUrl: jest.fn(),
                                initOneTimePaymentFields: jest.fn(),
                            },
                        },
                    },
                    {
                        provide: STRIPE,
                        useValue: {
                            checkout: {
                                sessions: {
                                    create: jest.fn()
                                }
                            }
                        },
                    },
                    {
                        provide: PaypalClient,
                        useValue: {
                            createOrder: jest.fn()
                        },
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: {
                            createInvoice: jest.fn()
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: {
                            enqueue: jest.fn()
                        },
                    },
                    {
                        provide: KeycloakAuthGraphQLGuard,
                        useValue: authGuard,
                    },
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
                        },
                    },
                ],
            })
        })

        beforeEach(async () => {
            await world.truncate(
                "course_vouchers",
                "reward_redemptions",
                "transaction_items",
                "transactions",
                "enrollments",
                "pricing_phases",
                "courses",
                "users",
            )
            payosCreate.mockReset()
            currentUser = await world.mintLearner(`checkout-resilience-${Date.now()}`)
            const courses = await Promise.all(["one",
                "two"].map(async (suffix) => {
                const course = await world.entityManager.save(
                    world.entityManager.create(CourseEntity,
                        {
                            title: `Checkout ${suffix}`,
                            displayId: `checkout-${suffix}-${Date.now()}`,
                            description: "resilience fixture",
                            originalPrice: 1_000_000,
                            defaultLocale: Locale.En,
                        }),
                )
                await world.entityManager.save(
                    world.entityManager.create(PricingPhaseEntity,
                        {
                            course,
                            phase: PricingPhase.EarlyBird,
                            price: 1_000_000,
                        }),
                )
                return course
            }))
            courseIds = courses.map((course) => course.id)
        })

        afterAll(async () => {
            await world?.close()
        })

        it("reuses one fresh checkout for sequential and concurrent duplicate requests",
            async () => {
                let releaseProvider: (() => void) | undefined
                const providerGate = new Promise<void>((resolve) => {
                    releaseProvider = resolve
                })
                payosCreate.mockImplementation(async (input: { orderCode: number; amount: number }) => {
                    await providerGate
                    return {
                        orderCode: input.orderCode,
                        amount: input.amount,
                        checkoutUrl: "https://payos.test/checkout",
                    }
                })

                const first = checkout()
                const second = checkout()
                releaseProvider?.()
                const [firstResponse,
                    secondResponse] = await Promise.all([first,
                    second])
                const firstData = firstResponse.body.data.coursesCheckout.data
                const secondData = secondResponse.body.data.coursesCheckout.data

                expect(firstData.transactionId).toBe(secondData.transactionId)
                expect((await checkout()).body.data.coursesCheckout.data.transactionId)
                    .toBe(firstData.transactionId)
                expect(payosCreate).toHaveBeenCalledTimes(1)
                expect(await world.entityManager.count(TransactionEntity)).toBe(1)
                expect(await world.entityManager.count(TransactionItemEntity)).toBe(2)
            })

        it("retries a transient gateway failure and persists only the successful checkout",
            async () => {
                payosCreate
                    .mockRejectedValueOnce(new Error("temporary provider outage"))
                    .mockImplementationOnce(async (input: { orderCode: number; amount: number }) => ({
                        orderCode: input.orderCode,
                        amount: input.amount,
                        checkoutUrl: "https://payos.test/recovered",
                    }))

                const response = await checkout()
                expect(response.body.data.coursesCheckout.success).toBe(true)
                expect(payosCreate).toHaveBeenCalledTimes(2)
                expect(await world.entityManager.count(TransactionEntity)).toBe(1)
                expect(await world.entityManager.count(TransactionItemEntity)).toBe(2)
            })

        it("replaces a stale pending checkout instead of reviving an abandoned provider order",
            async () => {
                payosCreate.mockImplementation(async (input: { orderCode: number; amount: number }) => ({
                    orderCode: input.orderCode,
                    amount: input.amount,
                    checkoutUrl: `https://payos.test/${input.orderCode}`,
                }))
                const first = await checkout()
                const firstId = first.body.data.coursesCheckout.data.transactionId
                await world.entityManager.query(
                    "UPDATE transactions SET created_at = NOW() - INTERVAL '1 day' WHERE id = $1",
                    [firstId],
                )

                const second = await checkout()
                expect(second.body.data.coursesCheckout.data.transactionId).not.toBe(firstId)
                expect(payosCreate).toHaveBeenCalledTimes(2)
                expect(await world.entityManager.count(TransactionEntity)).toBe(2)
                expect(await world.entityManager.count(TransactionItemEntity)).toBe(4)
            })

        it("leaves no local order when gateway retries are exhausted",
            async () => {
                payosCreate.mockRejectedValue(new Error("provider unavailable"))
                const response = await checkout()

                expect(response.body.data.coursesCheckout.success).toBe(false)
                expect(await world.entityManager.count(TransactionEntity)).toBe(0)
                expect(await world.entityManager.count(TransactionItemEntity)).toBe(0)
            })

        it("rolls the order back when any cart item cannot be persisted",
            async () => {
                payosCreate.mockImplementation(async (input: { orderCode: number; amount: number }) => ({
                    orderCode: input.orderCode,
                    amount: input.amount,
                    checkoutUrl: "https://payos.test/created",
                }))
                await world.entityManager.query(`
                    CREATE OR REPLACE FUNCTION fail_checkout_item_insert() RETURNS trigger AS $$
                    BEGIN RAISE EXCEPTION 'injected item persistence failure'; END;
                    $$ LANGUAGE plpgsql;
                    CREATE TRIGGER fail_checkout_item_insert
                    BEFORE INSERT ON transaction_items
                    FOR EACH ROW EXECUTE FUNCTION fail_checkout_item_insert();
                `)
                try {
                    const response = await checkout()
                    expect(response.body.data.coursesCheckout.success).toBe(false)
                    expect(await world.entityManager.count(TransactionEntity)).toBe(0)
                    expect(await world.entityManager.count(TransactionItemEntity)).toBe(0)
                } finally {
                    await world.entityManager.query(
                        "DROP TRIGGER IF EXISTS fail_checkout_item_insert ON transaction_items; DROP FUNCTION IF EXISTS fail_checkout_item_insert();",
                    )
                }
            })

        it("lets only one concurrent checkout reserve a voucher",
            async () => {
                const redemption = await world.entityManager.save(
                    world.entityManager.create(RewardRedemptionEntity,
                        {
                            user: currentUser!,
                            rewardKey: "checkout-race-voucher",
                            cost: 800,
                            status: RewardRedemptionStatus.Granted,
                            metadata: null,
                        }),
                )
                const voucher = await world.entityManager.save(
                    world.entityManager.create(CourseVoucherEntity,
                        {
                            user: currentUser!,
                            redemption,
                            course: null,
                            code: `RACE-${Date.now()}`,
                            discountType: VoucherDiscountType.Percent,
                            value: 10,
                            status: VoucherStatus.Unused,
                            expiresAt: new Date(Date.now() + 60_000),
                        }),
                )
                payosCreate.mockImplementation(async (input: { orderCode: number; amount: number }) => ({
                    orderCode: input.orderCode,
                    amount: input.amount,
                    checkoutUrl: "https://payos.test/voucher",
                }))
                const enroll = async (courseId: string) => request(world.app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: COURSE_ENROLL_MUTATION,
                        variables: {
                            request: {
                                courseId,
                                paymentType: PaymentType.PayOS,
                                payosReturnUrl: "https://client.test/success",
                                payosCancelUrl: "https://client.test/cancel",
                                voucherCode: voucher.code,
                            },
                        },
                    })

                const responses = await Promise.all(courseIds.map(enroll))
                const payloads = responses.map((response) => response.body.data.courseEnroll)
                expect(payloads.filter((payload) => payload.success)).toHaveLength(1)
                expect(payosCreate).toHaveBeenCalledTimes(1)
                expect(await world.entityManager.count(TransactionEntity)).toBe(1)
                const reserved = await world.entityManager.findOneOrFail(CourseVoucherEntity,
                    {
                        where: {
                            id: voucher.id
                        },
                    })
                expect(reserved.status).toBe(VoucherStatus.Reserved)
                expect(reserved.reservedTransactionId).not.toBeNull()
            })
    })
