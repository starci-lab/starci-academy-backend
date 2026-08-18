import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
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
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException,
} from "@modules/platform/exceptions/errors/courses/payos-return-url-and-payos-cancel-url-must-be-required"
import {
    MissingUsdPriceException,
} from "@modules/platform/exceptions/errors/payment/missing-usd-price"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
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
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import type {
    CoursePriceQuoteResult,
} from "@modules/bussiness/course-pricing/types"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    CourseEnrollRequest,
} from "./graphql-types/request"
import type {
    CourseEnrollResponseData,
} from "./graphql-types/response"
import {
    CourseEnrollStripeService,
} from "./course-enroll-stripe.service"
import {
    CourseEnrollPaypalService,
} from "./course-enroll-paypal.service"
import {
    CourseEnrollCryptoService,
} from "./course-enroll-crypto.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The buyer every checkout under test belongs to. */
const BUYER_ID = "user-1"

/** The course every checkout under test is for. */
const COURSE_ID = "course-1"

/** VND total stored on the transaction as the stable domestic reference. */
const TOTAL_CHARGED_VND = 2_000_000

/** USD total the international gateway actually charges. */
const TOTAL_CHARGED_USD = 79

/** Params for the `RetryService.retry` mock. */
interface RetryServiceRetryParams {
    /** The action the production code wants retried. */
    action: () => Promise<unknown>
}

/** The three provider clients, all registered so any of the three services can resolve. */
interface GatewayClients {
    /** Stripe SDK stand-in exposing hosted Checkout Session creation. */
    stripe: { checkout: { sessions: { create: jest.Mock } } }
    /** PayPal client stand-in exposing order creation. */
    paypal: { createOrder: jest.Mock }
    /** NOWPayments client stand-in exposing invoice creation. */
    crypto: { createInvoice: jest.Mock }
}

/** Anything the three enroll services expose that these tests drive. */
interface EnrollService {
    /** Builds (or reuses) a provider checkout for one enrollment request. */
    execute: (
        params: ExecuteParams<CourseEnrollRequest>,
        quote: CoursePriceQuoteResult,
    ) => Promise<CourseEnrollResponseData>
}

/** One international gateway under test, and how its provider client is driven. */
interface GatewayCase {
    /** Display name in the test titles. */
    label: string
    /** Payment type the service tags its transaction with. */
    paymentType: PaymentType
    /** Nest provider token for the service class. */
    token: unknown
    /** Hosted URL the provider client hands back. */
    checkoutUrl: string
    /** Provider-side payment id persisted for reconciliation. */
    providerPaymentId: string
    /** The provider client method the service calls. */
    createCall: (clients: GatewayClients) => jest.Mock
    /** Asserts the provider was asked to charge the given USD amount. */
    expectCharged: (call: jest.Mock, usd: number) => void
}

/**
 * Build a minimal user stand-in carrying only the id the service reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/** Builds a one-line checkout quote with the given USD total. */
const quoteResult = (
    totalChargedUsd: number | null = TOTAL_CHARGED_USD,
): CoursePriceQuoteResult => ({
    lines: [{
        pricingPhase: PricingPhase.Regular,
        displayDiscountPercent: 20,
    }],
    totalChargedVnd: TOTAL_CHARGED_VND,
    totalChargedUsd,
    selectedInstallment: null,
}) as unknown as CoursePriceQuoteResult

/** The three international gateways, which share one implementation pattern. */
const GATEWAYS: Array<GatewayCase> = [
    {
        label: "Stripe",
        paymentType: PaymentType.Stripe,
        token: CourseEnrollStripeService,
        checkoutUrl: "https://stripe/session",
        providerPaymentId: "cs_test_1",
        createCall: (clients) => clients.stripe.checkout.sessions.create,
        expectCharged: (call, usd) => {
            expect(call).toHaveBeenCalledWith(
                expect.objectContaining({
                    line_items: [
                        expect.objectContaining({
                            price_data: expect.objectContaining({
                                // Stripe bills in the smallest unit -- dollars become cents
                                unit_amount: Math.round(usd * 100),
                            }),
                        }),
                    ],
                }),
            )
        },
    },
    {
        label: "PayPal",
        paymentType: PaymentType.Paypal,
        token: CourseEnrollPaypalService,
        checkoutUrl: "https://paypal/approve",
        providerPaymentId: "paypal-order-1",
        createCall: (clients) => clients.paypal.createOrder,
        expectCharged: (call, usd) => {
            expect(call).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: usd,
                }),
            )
        },
    },
    {
        label: "Crypto",
        paymentType: PaymentType.Crypto,
        token: CourseEnrollCryptoService,
        checkoutUrl: "https://nowpayments/invoice",
        providerPaymentId: "invoice-1",
        createCall: (clients) => clients.crypto.createInvoice,
        expectCharged: (call, usd) => {
            expect(call).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: usd,
                }),
            )
        },
    },
]

/**
 * The three INTERNATIONAL gateways (Stripe, PayPal, NOWPayments) are one
 * implementation pattern behind three clients: charge the explicit USD price, never
 * the VND one; refuse to start when the course has no USD price configured; serialize
 * one logical checkout on an advisory lock; and reserve any voucher in the very
 * transaction that inserts the pending row.
 *
 * The domestic VND gateways this product actually leads with -- SePay and PayOS --
 * have their own suites; they differ in that they honour Flat vouchers and installment
 * plans, neither of which reaches these three.
 */
describe.each(GATEWAYS)("CourseEnroll$label international gateway",
    (gateway: GatewayCase) => {
        let module: TestingModule
        let service: EnrollService
        let entityManager: EntityManagerMock
        let clients: GatewayClients
        let enqueueReconcileTransactionJobService: { enqueue: jest.Mock }
        let voucherService: { reserve: jest.Mock }
        let queryRunner: { connect: jest.Mock, query: jest.Mock, release: jest.Mock, manager: EntityManagerMock }

        /** Programs the course + pending-transaction lookups, by entity. */
        const programLookups = (
            rows: {
                course?: Record<string, unknown> | null
                pending?: Record<string, unknown> | null
            } = {
            },
        ) => {
            entityManager.findOne.mockImplementation(async (entity: unknown) => {
                if (entity === CourseEntity) {
                    return rows.course === undefined
                        ? {
                            id: COURSE_ID,
                        }
                        : rows.course
                }
                if (entity === TransactionEntity) {
                    return rows.pending ?? null
                }
                return null
            })
        }

        /** Builds the execute params for one enrollment request. */
        const params = (
            request: Partial<CourseEnrollRequest> = {
            },
        ): ExecuteParams<CourseEnrollRequest> => ({
            request: {
                courseId: COURSE_ID,
                paymentType: gateway.paymentType,
                payosReturnUrl: "https://app/ok",
                payosCancelUrl: "https://app/cancel",
                ...request,
            },
            user: fakeUser(BUYER_ID),
        }) as unknown as ExecuteParams<CourseEnrollRequest>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.save.mockImplementation(async (entity: { id?: string }) => {
                entity.id = "txn-new"
                return entity
            })
            queryRunner = {
                connect: jest.fn(async () => undefined),
                query: jest.fn(async () => []),
                release: jest.fn(async () => undefined),
                manager: entityManager,
            }
            Object.assign(
                entityManager,
                {
                    connection: {
                        createQueryRunner: jest.fn(() => queryRunner),
                    },
                },
            )

            clients = {
                stripe: {
                    checkout: {
                        sessions: {
                            create: jest.fn().mockResolvedValue({
                                url: "https://stripe/session",
                                id: "cs_test_1",
                            }),
                        },
                    },
                },
                paypal: {
                    createOrder: jest.fn().mockResolvedValue({
                        approveUrl: "https://paypal/approve",
                        orderId: "paypal-order-1",
                    }),
                },
                crypto: {
                    createInvoice: jest.fn().mockResolvedValue({
                        invoiceUrl: "https://nowpayments/invoice",
                        invoiceId: "invoice-1",
                    }),
                },
            }
            enqueueReconcileTransactionJobService = {
                enqueue: jest.fn(),
            }
            voucherService = {
                reserve: jest.fn(),
            }

            module = await Test.createTestingModule({
                providers: [
                    CourseEnrollStripeService,
                    CourseEnrollPaypalService,
                    CourseEnrollCryptoService,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: STRIPE,
                        useValue: clients.stripe,
                    },
                    {
                        provide: PaypalClient,
                        useValue: clients.paypal,
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: clients.crypto,
                    },
                    {
                        // RetryService just runs the action once for the unit test
                        provide: RetryService,
                        useValue: {
                            retry: jest.fn(
                                ({
                                    action,
                                }: RetryServiceRetryParams) => action(),
                            ),
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcileTransactionJobService,
                    },
                    {
                        provide: VoucherService,
                        useValue: voucherService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<EnrollService>(gateway.token as never)
        })

        afterEach(async () => {
            await module.close()
        })

        it("refuses an anonymous checkout before taking the advisory lock",
            async () => {
                const anonymous = {
                    request: {
                        courseId: COURSE_ID,
                    },
                    user: undefined,
                } as unknown as ExecuteParams<CourseEnrollRequest>

                await expect(service.execute(anonymous,
                    quoteResult())).rejects.toBeInstanceOf(UserNotFoundException)

                expect(queryRunner.connect).not.toHaveBeenCalled()
            })

        it("refuses an anonymous caller inside the locked section too",
            async () => {
                const locked = service as unknown as {
                    executeLocked: (
                        input: ExecuteParams<CourseEnrollRequest>,
                        quote: CoursePriceQuoteResult,
                        manager: unknown,
                    ) => Promise<unknown>
                }

                await expect(locked.executeLocked(
                    {
                        request: {
                            courseId: COURSE_ID,
                        },
                        user: undefined,
                    } as unknown as ExecuteParams<CourseEnrollRequest>,
                    quoteResult(),
                    entityManager,
                )).rejects.toBeInstanceOf(UserNotFoundException)
            })

        it("serializes a plain checkout on a course-and-provider lock key",
            async () => {
                programLookups()

                await service.execute(params(),
                    quoteResult())

                expect(queryRunner.query).toHaveBeenNthCalledWith(
                    1,
                    "SELECT pg_advisory_lock(hashtextextended($1, 0))",
                    [`checkout:course:${BUYER_ID}:${COURSE_ID}:${gateway.paymentType}`],
                )
                expect(queryRunner.release).toHaveBeenCalledTimes(1)
            })

        it("serializes a voucher checkout on the voucher key",
            async () => {
                programLookups()

                await service.execute(params({
                    voucherCode: "SAVE50",
                }),
                quoteResult())

                expect(queryRunner.query).toHaveBeenNthCalledWith(
                    1,
                    "SELECT pg_advisory_lock(hashtextextended($1, 0))",
                    [`checkout:voucher:${BUYER_ID}:SAVE50`],
                )
            })

        it("reports a missing course rather than opening a provider order for it",
            async () => {
                programLookups({
                    course: null,
                })

                await expect(service.execute(params(),
                    quoteResult())).rejects.toBeInstanceOf(CourseNotFoundException)

                expect(gateway.createCall(clients)).not.toHaveBeenCalled()
                expect(queryRunner.release).toHaveBeenCalledTimes(1)
            })

        it("refuses to charge a course that has no USD price configured",
            async () => {
                programLookups()

                await expect(service.execute(params(),
                    quoteResult(null))).rejects.toBeInstanceOf(MissingUsdPriceException)

                expect(gateway.createCall(clients)).not.toHaveBeenCalled()
            })

        it("refuses to charge a negative USD price rather than treating it as a credit",
            async () => {
                programLookups()

                await expect(service.execute(params(),
                    quoteResult(-5))).rejects.toBeInstanceOf(MissingUsdPriceException)

                expect(gateway.createCall(clients)).not.toHaveBeenCalled()
            })

        it("charges the USD price while persisting the VND total as the stable reference",
            async () => {
                programLookups()

                const result = await service.execute(params(),
                    quoteResult())

                gateway.expectCharged(gateway.createCall(clients),
                    TOTAL_CHARGED_USD)
                expect(entityManager.create).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        amount: TOTAL_CHARGED_VND,
                        discountPercent: 20,
                        voucherCode: null,
                        pricingPhase: PricingPhase.Regular,
                        paymentType: gateway.paymentType,
                        checkoutUrl: gateway.checkoutUrl,
                        providerPaymentId: gateway.providerPaymentId,
                        status: TransactionStatus.Pending,
                        actionType: ActionType.Enroll,
                    }),
                )
                expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-new",
                })
                expect(result).toEqual({
                    checkoutUrl: gateway.checkoutUrl,
                    referenceId: expect.stringMatching(/^\d+$/),
                    transactionId: "txn-new",
                    amount: TOTAL_CHARGED_VND,
                })
            })

        it("reserves the voucher inside the same write transaction that inserts the row",
            async () => {
                programLookups()

                await service.execute(params({
                    voucherCode: "SAVE50",
                }),
                quoteResult())

                expect(entityManager.create).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        voucherCode: "SAVE50",
                    }),
                )
                expect(voucherService.reserve).toHaveBeenCalledWith({
                    entityManager,
                    userId: BUYER_ID,
                    code: "SAVE50",
                    courseId: COURSE_ID,
                    transactionId: "txn-new",
                })
                expect(entityManager.save.mock.invocationCallOrder[0])
                    .toBeLessThan(voucherService.reserve.mock.invocationCallOrder[0])
            })

        it("hands back a still-fresh pending order untouched",
            async () => {
                programLookups({
                    pending: {
                        id: "txn-existing",
                        referenceId: "112233",
                        amount: 1_500_000,
                        checkoutUrl: "https://provider/existing",
                        createdAt: new Date(),
                    },
                })

                const result = await service.execute(params(),
                    quoteResult())

                expect(gateway.createCall(clients)).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(result).toEqual({
                    checkoutUrl: "https://provider/existing",
                    referenceId: "112233",
                    transactionId: "txn-existing",
                    amount: 1_500_000,
                })
            })

        it("opens a new order once the pending one has aged out of the reuse window",
            async () => {
                programLookups({
                    pending: {
                        id: "txn-stale",
                        referenceId: "112233",
                        amount: 1_500_000,
                        checkoutUrl: "https://provider/stale",
                        createdAt: new Date(0),
                    },
                })

                const result = await service.execute(params(),
                    quoteResult())

                expect(gateway.createCall(clients)).toHaveBeenCalledTimes(1)
                expect(result.transactionId).toBe("txn-new")
                expect(result.checkoutUrl).toBe(gateway.checkoutUrl)
            })

        it("refuses to start a checkout with no return URL",
            async () => {
                programLookups()

                await expect(service.execute(params({
                    payosReturnUrl: undefined,
                }),
                quoteResult())).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(gateway.createCall(clients)).not.toHaveBeenCalled()
            })

        it("refuses to start a checkout with no cancel URL",
            async () => {
                programLookups()

                await expect(service.execute(params({
                    payosCancelUrl: undefined,
                }),
                quoteResult())).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(gateway.createCall(clients)).not.toHaveBeenCalled()
            })

        it("gives each new order its own reference code",
            async () => {
                programLookups()

                const first = await service.execute(params(),
                    quoteResult())
                const second = await service.execute(params(),
                    quoteResult())

                expect(first.referenceId).not.toBe(second.referenceId)
            })
    })

/**
 * Stripe alone can hand back a session with no hosted URL (the field is optional on
 * the SDK's own type). The checkout then carries an empty URL rather than the string
 * "undefined", which is what a bare template interpolation would have produced.
 */
describe("CourseEnrollStripeService — session with no hosted URL",
    () => {
        it("stores and returns an empty checkout URL rather than a stringified undefined",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.save.mockImplementation(async (entity: { id?: string }) => {
                    entity.id = "txn-new"
                    return entity
                })
                entityManager.findOne.mockImplementation(async (entity: unknown) => (
                    entity === CourseEntity
                        ? {
                            id: COURSE_ID,
                        }
                        : null
                ))
                const queryRunner = {
                    connect: jest.fn(async () => undefined),
                    query: jest.fn(async () => []),
                    release: jest.fn(async () => undefined),
                    manager: entityManager,
                }
                Object.assign(
                    entityManager,
                    {
                        connection: {
                            createQueryRunner: jest.fn(() => queryRunner),
                        },
                    },
                )
                const stripe = {
                    checkout: {
                        sessions: {
                            create: jest.fn().mockResolvedValue({
                                url: null,
                                id: "cs_test_1",
                            }),
                        },
                    },
                }

                const module = await Test.createTestingModule({
                    providers: [
                        CourseEnrollStripeService,
                        DayjsService,
                        {
                            provide: STRIPE,
                            useValue: stripe,
                        },
                        {
                            provide: RetryService,
                            useValue: {
                                retry: jest.fn(
                                    ({
                                        action,
                                    }: RetryServiceRetryParams) => action(),
                                ),
                            },
                        },
                        {
                            provide: EnqueueReconcileTransactionJobService,
                            useValue: {
                                enqueue: jest.fn(),
                            },
                        },
                        {
                            provide: VoucherService,
                            useValue: {
                                reserve: jest.fn(),
                            },
                        },
                        {
                            provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                            useValue: entityManager,
                        },
                    ],
                }).compile()
                const service = module.get<EnrollService>(CourseEnrollStripeService as never)

                const result = await service.execute(
                    {
                        request: {
                            courseId: COURSE_ID,
                            paymentType: PaymentType.Stripe,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser(BUYER_ID),
                    } as unknown as ExecuteParams<CourseEnrollRequest>,
                    quoteResult(),
                )

                expect(result.checkoutUrl).toBe("")
                expect(entityManager.create).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        checkoutUrl: "",
                    }),
                )
                await module.close()
            })
    })
