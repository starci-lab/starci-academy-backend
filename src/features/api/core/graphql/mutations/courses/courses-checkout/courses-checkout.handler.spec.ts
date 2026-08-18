// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CoursePriceQuoteService,
} from "@modules/bussiness/course-pricing/course-price-quote.service"
import {
    CoursePriceQuoteIntent,
} from "@modules/bussiness/course-pricing/types"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    TransactionItemEntity,
} from "@modules/databases/postgresql/primary/entities/transaction-item.entity"
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
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException,
} from "@modules/platform/exceptions/errors/courses/payos-return-url-and-payos-cancel-url-must-be-required"
import {
    CoursesCheckoutEmptyException,
} from "@modules/platform/exceptions/errors/payment/courses-checkout-empty"
import {
    InstallmentCurrencyNotSupportedException,
} from "@modules/platform/exceptions/errors/payment/installment-currency-not-supported"
import {
    MissingUsdPriceException,
} from "@modules/platform/exceptions/errors/payment/missing-usd-price"
import {
    UnsupportedPaymentTypeException,
} from "@modules/platform/exceptions/errors/payment/unsupported-payment-type"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
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
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CoursesCheckoutCommand,
} from "./courses-checkout.command"

import {
    CoursesCheckoutHandler,
} from "./courses-checkout.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Params accepted by the `RetryService.retry` mock. */
interface RetryServiceRetryParams {
    action: () => Promise<unknown>
}

/** Overrides accepted by {@link makeQuote}. */
interface QuoteOverrides {
    courseIds?: Array<string>
    totalChargedVnd?: number
    totalChargedUsd?: number | null
    selectedInstallment?: {
        months: number
        markupPercent: number
        totalAmountVnd: number
        monthlyAmountVnd: number
    } | null
}

/**
 * Build a minimal buyer stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/**
 * Build a priced-cart quote in the shape `CoursePriceQuoteService.quote` returns.
 * Only the fields the handler reads are populated.
 *
 * @param overrides - Course ids, order totals and the selected installment plan.
 * @returns a quote result stand-in.
 */
const makeQuote = (
    overrides: QuoteOverrides = {
    },
): unknown => {
    const courseIds = overrides.courseIds ?? [
        "course-a",
    ]
    return {
        lines: courseIds.map((courseId, index) => ({
            course: {
                id: courseId,
            },
            chargedVnd: 100_000 * (index + 1),
            displayDiscountPercent: 10,
            pricingPhase: PricingPhase.Regular,
        })),
        totalChargedVnd: overrides.totalChargedVnd ?? 100_000,
        totalChargedUsd: overrides.totalChargedUsd === undefined
            ? 5
            : overrides.totalChargedUsd,
        itemCount: courseIds.length,
        selectedInstallment: overrides.selectedInstallment ?? null,
    }
}

describe("CoursesCheckoutHandler",
    () => {
        let module: TestingModule
        let handler: CoursesCheckoutHandler
        let entityManager: EntityManagerMock
        let payos: { paymentRequests: { create: jest.Mock } }
        let sepay: { checkout: { initOneTimePaymentFields: jest.Mock; initCheckoutUrl: jest.Mock } }
        let stripe: { checkout: { sessions: { create: jest.Mock } } }
        let paypalClient: { createOrder: jest.Mock }
        let nowPaymentsClient: { createInvoice: jest.Mock }
        let coursePriceQuoteService: { quote: jest.Mock }
        let enqueueReconcileTransactionJobService: { enqueue: jest.Mock }

        /**
         * Program the two `find` reads the transaction body performs: the pending
         * order candidates, then that candidate's line items.
         *
         * @param pending - Pending `transactions` rows, newest first.
         * @param items - `transaction_items` rows belonging to the candidate.
         */
        const stubPending = (
            pending: Array<unknown>,
            items: Array<unknown> = [
            ],
        ): void => {
            entityManager.find.mockImplementation(async (entity: unknown) => {
                if (entity === TransactionEntity) {
                    return pending
                }
                return items
            })
        }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            // no pending order by default -> every test takes the "create fresh" path
            stubPending([
            ])
            // the DB assigns the order id on insert
            entityManager.save.mockImplementation(async (entity: unknown) => {
                if (!Array.isArray(entity)) {
                    (entity as { id?: string }).id = "txn-1"
                }
                return entity
            })

            payos = {
                paymentRequests: {
                    create: jest.fn().mockResolvedValue({
                        checkoutUrl: "https://payos/checkout",
                        amount: 100_000,
                    }),
                },
            }
            sepay = {
                checkout: {
                    initOneTimePaymentFields: jest.fn().mockReturnValue({
                        signature: "sig",
                    }),
                    initCheckoutUrl: jest.fn().mockReturnValue("https://sepay/checkout"),
                },
            }
            stripe = {
                checkout: {
                    sessions: {
                        create: jest.fn().mockResolvedValue({
                            id: "cs_test_1",
                            url: "https://stripe/checkout",
                        }),
                    },
                },
            }
            paypalClient = {
                createOrder: jest.fn().mockResolvedValue({
                    orderId: "pp-order-1",
                    approveUrl: "https://paypal/approve",
                }),
            }
            nowPaymentsClient = {
                createInvoice: jest.fn().mockResolvedValue({
                    invoiceId: "np-invoice-1",
                    invoiceUrl: "https://nowpayments/invoice",
                }),
            }
            coursePriceQuoteService = {
                quote: jest.fn().mockResolvedValue(makeQuote()),
            }
            enqueueReconcileTransactionJobService = {
                enqueue: jest.fn(),
            }

            module = await Test.createTestingModule({
                providers: [
                    CoursesCheckoutHandler,
                    {
                        provide: PAYOS,
                        useValue: payos,
                    },
                    {
                        provide: SEPAY,
                        useValue: sepay,
                    },
                    {
                        provide: STRIPE,
                        useValue: stripe,
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
                        provide: CoursePriceQuoteService,
                        useValue: coursePriceQuoteService,
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
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<CoursesCheckoutHandler>(CoursesCheckoutHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("refuses an unauthenticated checkout before pricing anything",
            async () => {
                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.PayOS,
                                returnUrl: "https://app/ok",
                                cancelUrl: "https://app/cancel",
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                expect(coursePriceQuoteService.quote).not.toHaveBeenCalled()
                expect(entityManager.transaction).not.toHaveBeenCalled()
            })

        it("refuses installments on a USD gateway that cannot collect later cycles",
            async () => {
                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.Stripe,
                                returnUrl: "https://app/ok",
                                cancelUrl: "https://app/cancel",
                                installmentMonths: 3,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(InstallmentCurrencyNotSupportedException)

                // rejected before the cart is even priced
                expect(coursePriceQuoteService.quote).not.toHaveBeenCalled()
                expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
            })

        it("refuses installments on a gateway absent from the capability matrix",
            async () => {
                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: "momo" as PaymentType,
                                returnUrl: "https://app/ok",
                                cancelUrl: "https://app/cancel",
                                installmentMonths: 6,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(InstallmentCurrencyNotSupportedException)

                expect(coursePriceQuoteService.quote).not.toHaveBeenCalled()
            })

        it("refuses a cart with nothing purchasable left to buy",
            async () => {
                // every requested course is already owned -> the quote prices no lines
                coursePriceQuoteService.quote.mockResolvedValueOnce({
                    lines: [
                    ],
                    totalChargedVnd: 0,
                    totalChargedUsd: 0,
                    itemCount: 0,
                    selectedInstallment: null,
                })

                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.PayOS,
                                returnUrl: "https://app/ok",
                                cancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(CoursesCheckoutEmptyException)

                // no zero-total checkout is opened
                expect(entityManager.transaction).not.toHaveBeenCalled()
                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("prices the cart, opens one PayOS payment and persists the order with a line per course",
            async () => {
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    courseIds: [
                        "course-b",
                        "course-a",
                    ],
                    totalChargedVnd: 300_000,
                }))
                payos.paymentRequests.create.mockResolvedValueOnce({
                    checkoutUrl: "https://payos/checkout",
                    amount: 300_000,
                })

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-b",
                                "course-a",
                            ],
                            paymentType: PaymentType.PayOS,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the shared pricing engine is asked for a CHECKOUT quote
                expect(coursePriceQuoteService.quote).toHaveBeenCalledWith({
                    userId: "user-1",
                    courseIds: [
                        "course-b",
                        "course-a",
                    ],
                    intent: CoursePriceQuoteIntent.Checkout,
                    installmentMonths: undefined,
                })
                // the whole body runs under one advisory lock keyed by cart identity
                expect(entityManager.query).toHaveBeenCalledWith(
                    "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
                    [
                        "checkout:cart:user-1:payos:course-a,course-b:0",
                    ],
                )
                // one PayOS link for the summed VND total
                expect(payos.paymentRequests.create).toHaveBeenCalledWith({
                    amount: 300_000,
                    cancelUrl: "https://app/cancel",
                    description: "EN",
                    orderCode: expect.any(Number),
                    returnUrl: "https://app/ok",
                })

                // the parent order row is a cartwide, course-less enroll transaction
                const orderRow = entityManager.create.mock.calls
                    .find(([entity]) => entity === TransactionEntity)?.[1] as Record<string, unknown>
                expect(orderRow).toMatchObject({
                    course: null,
                    amount: 300_000,
                    discountPercent: 0,
                    pricingPhase: PricingPhase.Regular,
                    paymentType: PaymentType.PayOS,
                    checkoutUrl: "https://payos/checkout",
                    // PayOS reconciles by referenceId, so no native payment id is stored
                    providerPaymentId: null,
                    status: TransactionStatus.Pending,
                    actionType: ActionType.Enroll,
                    installmentMonths: null,
                    installmentMarkupPercent: null,
                    installmentTotalVnd: null,
                })

                // one transaction_items row per priced course
                const itemRows = entityManager.create.mock.calls
                    .filter(([entity]) => entity === TransactionItemEntity)
                    .map(([, data]) => data as Record<string, unknown>)
                expect(itemRows).toHaveLength(2)
                expect(itemRows.map((row) => (row.course as { id: string }).id)).toEqual([
                    "course-b",
                    "course-a",
                ])
                expect(itemRows[0].amount).toBe(100_000)
                expect(itemRows[1].amount).toBe(200_000)

                // the delayed reconcile poll is scheduled for the persisted order
                expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-1",
                })
                expect(result).toEqual({
                    checkoutUrl: "https://payos/checkout",
                    referenceId: expect.any(String),
                    transactionId: "txn-1",
                    amount: 300_000,
                    itemCount: 2,
                    checkoutFields: undefined,
                })
            })

        it("charges only the first cycle and snapshots the plan when an installment is selected",
            async () => {
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    totalChargedVnd: 900_000,
                    selectedInstallment: {
                        months: 3,
                        markupPercent: 10,
                        totalAmountVnd: 990_000,
                        monthlyAmountVnd: 330_000,
                    },
                }))
                payos.paymentRequests.create.mockResolvedValueOnce({
                    checkoutUrl: "https://payos/checkout",
                    amount: 330_000,
                })

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                            ],
                            paymentType: PaymentType.PayOS,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                            installmentMonths: 3,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the gateway collects the MONTHLY amount, not the whole cart
                expect(payos.paymentRequests.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: 330_000,
                    }),
                )
                // the chosen term is part of the lock identity
                expect(entityManager.query).toHaveBeenCalledWith(
                    expect.any(String),
                    [
                        "checkout:cart:user-1:payos:course-a:3",
                    ],
                )
                // the plan intent is snapshotted for the enroll fan-out
                const orderRow = entityManager.create.mock.calls
                    .find(([entity]) => entity === TransactionEntity)?.[1] as Record<string, unknown>
                expect(orderRow).toMatchObject({
                    installmentMonths: 3,
                    installmentMarkupPercent: 10,
                    installmentTotalVnd: 990_000,
                })
                expect(result.amount).toBe(330_000)
            })

        it("rejects PayOS without both redirect URLs",
            async () => {
                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.PayOS,
                                returnUrl: "https://app/ok",
                                cancelUrl: undefined,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("signs SePay form fields for the summed VND total instead of a redirect link",
            async () => {
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    courseIds: [
                        "course-a",
                        "course-b",
                    ],
                    totalChargedVnd: 300_000,
                }))

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                                "course-b",
                            ],
                            paymentType: PaymentType.Sepay,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(sepay.checkout.initOneTimePaymentFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        operation: "PURCHASE",
                        order_amount: 300_000,
                        currency: "VND",
                        success_url: "https://app/ok",
                        cancel_url: "https://app/cancel",
                        error_url: "https://app/cancel",
                    }),
                )
                expect(result.checkoutUrl).toBe("https://sepay/checkout")
                // the client POSTs these signed fields as a form
                expect(result.checkoutFields).toBe(JSON.stringify({
                    signature: "sig",
                }))
                expect(result.amount).toBe(300_000)
            })

        it("charges the summed USD total in cents through Stripe and stores the session id",
            async () => {
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    courseIds: [
                        "course-a",
                        "course-b",
                    ],
                    totalChargedVnd: 300_000,
                    totalChargedUsd: 12.5,
                }))

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                                "course-b",
                            ],
                            paymentType: PaymentType.Stripe,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        mode: "payment",
                        success_url: "https://app/ok",
                        cancel_url: "https://app/cancel",
                        line_items: [
                            expect.objectContaining({
                                quantity: 1,
                                price_data: expect.objectContaining({
                                    currency: "usd",
                                    // 12.5 USD -> 1250 cents
                                    unit_amount: 1250,
                                }),
                            }),
                        ],
                    }),
                )
                expect(result.checkoutUrl).toBe("https://stripe/checkout")
                // the persisted amount stays the VND reference, not the USD charge
                expect(result.amount).toBe(300_000)
                const orderRow = entityManager.create.mock.calls
                    .find(([entity]) => entity === TransactionEntity)?.[1] as Record<string, unknown>
                expect(orderRow.providerPaymentId).toBe("cs_test_1")
            })

        it("falls back to an empty checkout URL when Stripe returns a session without one",
            async () => {
                stripe.checkout.sessions.create.mockResolvedValueOnce({
                    id: "cs_test_2",
                    url: null,
                })

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                            ],
                            paymentType: PaymentType.Stripe,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(result.checkoutUrl).toBe("")
            })

        it("rejects Stripe without both redirect URLs",
            async () => {
                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.Stripe,
                                returnUrl: "https://app/ok",
                                cancelUrl: undefined,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
            })

        it("never charges a VND total as USD through Stripe when the cart has no usable USD price",
            async () => {
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    totalChargedUsd: -1,
                }))

                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.Stripe,
                                returnUrl: "https://app/ok",
                                cancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(MissingUsdPriceException)

                expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
            })

        it("creates a PayPal order for the summed USD total and stores the order id",
            async () => {
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    courseIds: [
                        "course-a",
                        "course-b",
                    ],
                    totalChargedVnd: 300_000,
                    totalChargedUsd: 12.5,
                }))

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                                "course-b",
                            ],
                            paymentType: PaymentType.Paypal,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(paypalClient.createOrder).toHaveBeenCalledWith(
                    expect.objectContaining({
                        // PayPal charges USD dollars, not cents
                        amount: 12.5,
                        returnUrl: "https://app/ok",
                        cancelUrl: "https://app/cancel",
                    }),
                )
                expect(result.checkoutUrl).toBe("https://paypal/approve")
                expect(result.amount).toBe(300_000)
                const orderRow = entityManager.create.mock.calls
                    .find(([entity]) => entity === TransactionEntity)?.[1] as Record<string, unknown>
                expect(orderRow.providerPaymentId).toBe("pp-order-1")
            })

        it("rejects PayPal without both redirect URLs",
            async () => {
                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.Paypal,
                                returnUrl: "https://app/ok",
                                cancelUrl: undefined,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(paypalClient.createOrder).not.toHaveBeenCalled()
            })

        it("never charges a VND total as USD through PayPal when the cart has no usable USD price",
            async () => {
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    totalChargedUsd: -1,
                }))

                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.Paypal,
                                returnUrl: "https://app/ok",
                                cancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(MissingUsdPriceException)

                expect(paypalClient.createOrder).not.toHaveBeenCalled()
            })

        it("creates a hosted crypto invoice for the summed USD total and stores the invoice id",
            async () => {
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    totalChargedVnd: 300_000,
                    totalChargedUsd: 12.5,
                }))

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                            ],
                            paymentType: PaymentType.Crypto,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(nowPaymentsClient.createInvoice).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: 12.5,
                        successUrl: "https://app/ok",
                        cancelUrl: "https://app/cancel",
                    }),
                )
                expect(result.checkoutUrl).toBe("https://nowpayments/invoice")
                expect(result.amount).toBe(300_000)
                const orderRow = entityManager.create.mock.calls
                    .find(([entity]) => entity === TransactionEntity)?.[1] as Record<string, unknown>
                expect(orderRow.providerPaymentId).toBe("np-invoice-1")
            })

        it("rejects crypto without both redirect URLs",
            async () => {
                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.Crypto,
                                returnUrl: "https://app/ok",
                                cancelUrl: undefined,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(nowPaymentsClient.createInvoice).not.toHaveBeenCalled()
            })

        it("never charges a VND total as USD through crypto when the cart has no usable USD price",
            async () => {
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    totalChargedUsd: -1,
                }))

                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: PaymentType.Crypto,
                                returnUrl: "https://app/ok",
                                cancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(MissingUsdPriceException)

                expect(nowPaymentsClient.createInvoice).not.toHaveBeenCalled()
            })

        it("rejects a payment provider the handler does not implement",
            async () => {
                await expect(
                    handler.execute(
                        new CoursesCheckoutCommand({
                            request: {
                                courseIds: [
                                    "course-a",
                                ],
                                paymentType: "momo" as PaymentType,
                                returnUrl: "https://app/ok",
                                cancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(UnsupportedPaymentTypeException)

                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("hands back a still-fresh pending order for the same cart instead of charging twice",
            async () => {
                const candidate = {
                    id: "txn-existing",
                    referenceId: "555001",
                    amount: 300_000,
                    checkoutUrl: "https://payos/existing",
                    paymentType: PaymentType.PayOS,
                    createdAt: new Date(),
                }
                coursePriceQuoteService.quote.mockResolvedValueOnce(makeQuote({
                    courseIds: [
                        "course-a",
                        "course-b",
                    ],
                }))
                stubPending(
                    [
                        candidate,
                    ],
                    [
                        {
                            course: {
                                id: "course-b",
                            },
                        },
                        {
                            course: {
                                id: "course-a",
                            },
                        },
                    ],
                )

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                                "course-b",
                            ],
                            paymentType: PaymentType.PayOS,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // no second gateway checkout and no second order row
                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(result).toEqual({
                    checkoutUrl: "https://payos/existing",
                    referenceId: "555001",
                    transactionId: "txn-existing",
                    amount: 300_000,
                    itemCount: 2,
                    // PayOS is a redirect provider -> no signed form fields
                    checkoutFields: undefined,
                })
                // the reconcile poll is still (re)scheduled for the reused order
                expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-existing",
                })
            })

        it("re-signs the SePay fields when the reused pending order is a SePay checkout",
            async () => {
                stubPending(
                    [
                        {
                            id: "txn-existing",
                            referenceId: "555002",
                            amount: 100_000,
                            checkoutUrl: "https://sepay/existing",
                            paymentType: PaymentType.Sepay,
                            createdAt: new Date(),
                        },
                    ],
                    [
                        {
                            course: {
                                id: "course-a",
                            },
                        },
                    ],
                )

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                            ],
                            paymentType: PaymentType.Sepay,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the fields are re-signed from the EXISTING order code + amount
                expect(sepay.checkout.initOneTimePaymentFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        order_invoice_number: "555002",
                        order_amount: 100_000,
                    }),
                )
                expect(result.transactionId).toBe("txn-existing")
                expect(result.checkoutFields).toBe(JSON.stringify({
                    signature: "sig",
                }))
            })

        it("ignores a pending order that has aged past the reuse window and opens a new one",
            async () => {
                stubPending(
                    [
                        {
                            id: "txn-stale",
                            referenceId: "555003",
                            amount: 100_000,
                            checkoutUrl: "https://payos/stale",
                            paymentType: PaymentType.PayOS,
                            // far older than the configured reuse window
                            createdAt: new Date(0),
                        },
                    ],
                    [
                        {
                            course: {
                                id: "course-a",
                            },
                        },
                    ],
                )

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                            ],
                            paymentType: PaymentType.PayOS,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // a stale candidate is skipped before its items are even loaded
                expect(entityManager.find).not.toHaveBeenCalledWith(
                    TransactionItemEntity,
                    expect.anything(),
                )
                expect(payos.paymentRequests.create).toHaveBeenCalled()
                expect(result.transactionId).toBe("txn-1")
            })

        it("ignores a fresh pending order whose courses no longer match the cart",
            async () => {
                stubPending(
                    [
                        {
                            id: "txn-other-cart",
                            referenceId: "555004",
                            amount: 100_000,
                            checkoutUrl: "https://payos/other",
                            paymentType: PaymentType.PayOS,
                            createdAt: new Date(),
                        },
                    ],
                    [
                        {
                            course: {
                                id: "course-z",
                            },
                        },
                    ],
                )

                const result = await handler.execute(
                    new CoursesCheckoutCommand({
                        request: {
                            courseIds: [
                                "course-a",
                            ],
                            paymentType: PaymentType.PayOS,
                            returnUrl: "https://app/ok",
                            cancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // different cart -> a brand new order is opened
                expect(payos.paymentRequests.create).toHaveBeenCalled()
                expect(result.transactionId).toBe("txn-1")
                expect(result.checkoutUrl).toBe("https://payos/checkout")
            })
    })
