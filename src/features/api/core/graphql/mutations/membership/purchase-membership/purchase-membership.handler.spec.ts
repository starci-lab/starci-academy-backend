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
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
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
    MembershipNotAvailableException,
} from "@modules/platform/exceptions/errors/membership/membership-not-available"
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
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
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
    CheckoutGatewayService,
} from "@modules/bussiness/transactions/atomic/checkout-gateway.service"
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
    PurchaseMembershipCommand,
} from "./purchase-membership.command"
import {
    PurchaseMembershipHandler,
} from "./purchase-membership.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Params accepted by the `RetryService.retry` mock. */
interface RetryServiceRetryParams {
    action: () => Promise<unknown>
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

describe("PurchaseMembershipHandler",
    () => {
        let module: TestingModule
        let handler: PurchaseMembershipHandler
        let entityManager: EntityManagerMock
        let payos: { paymentRequests: { create: jest.Mock } }
        let sepay: { checkout: { initOneTimePaymentFields: jest.Mock; initCheckoutUrl: jest.Mock } }
        let stripe: { checkout: { sessions: { create: jest.Mock } } }
        let paypalClient: { createOrder: jest.Mock }
        let nowPaymentsClient: { createInvoice: jest.Mock }
        let mountFilesystemService: { appConfig: jest.Mock }
        let enqueueReconcileTransactionJobService: { enqueue: jest.Mock }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            // the DB assigns the transaction id on insert
            entityManager.save.mockImplementation(async (entity: unknown) => {
                (entity as { id?: string }).id = "txn-1"
                return entity
            })

            payos = {
                paymentRequests: {
                    create: jest.fn().mockResolvedValue({
                        checkoutUrl: "https://payos/checkout",
                        amount: 199_000,
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
            // live catalog: membership enabled with a VND + USD price
            mountFilesystemService = {
                appConfig: jest.fn().mockReturnValue({
                    membership: {
                        enabled: true,
                        priceVnd: 199_000,
                        priceUsd: 8,
                    },
                }),
            }
            enqueueReconcileTransactionJobService = {
                enqueue: jest.fn(),
            }

            module = await Test.createTestingModule({
                providers: [
                    PurchaseMembershipHandler,
                    // real collaborator -- exercises the actual lock/scan/dispatch
                    // shared with PurchaseAiSubscriptionHandler, wired to the mocks below
                    CheckoutGatewayService,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
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
                        provide: MountFilesystemService,
                        useValue: mountFilesystemService,
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

            handler = module.get<PurchaseMembershipHandler>(PurchaseMembershipHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("refuses an unauthenticated purchase before reading the catalog",
            async () => {
                await expect(
                    handler.execute(
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: PaymentType.PayOS,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: "https://app/cancel",
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                expect(mountFilesystemService.appConfig).not.toHaveBeenCalled()
                expect(entityManager.transaction).not.toHaveBeenCalled()
            })

        it("refuses the purchase when membership is disabled in the live catalog",
            async () => {
                mountFilesystemService.appConfig.mockReturnValueOnce({
                    membership: {
                        enabled: false,
                        priceVnd: 199_000,
                        priceUsd: 8,
                    },
                })

                await expect(
                    handler.execute(
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: PaymentType.PayOS,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(MembershipNotAvailableException)

                // no checkout and no pending row are created for a disabled product
                expect(entityManager.transaction).not.toHaveBeenCalled()
                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("opens a PayOS checkout, persists a pending row and schedules reconcile without activating membership",
            async () => {
                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: {
                            paymentType: PaymentType.PayOS,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the whole body runs under a per-user, per-gateway advisory lock
                expect(entityManager.query).toHaveBeenCalledWith(
                    "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
                    [
                        "checkout:membership:user-1:payos",
                    ],
                )
                // the reuse lookup is scoped to this user's pending membership orders
                expect(entityManager.findOne).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        where: {
                            user: {
                                id: "user-1",
                            },
                            actionType: ActionType.MembershipPurchase,
                            paymentType: PaymentType.PayOS,
                            status: TransactionStatus.Pending,
                        },
                    }),
                )
                expect(payos.paymentRequests.create).toHaveBeenCalledWith({
                    amount: 199_000,
                    cancelUrl: "https://app/cancel",
                    description: "EN",
                    orderCode: expect.any(Number),
                    returnUrl: "https://app/ok",
                })

                // the row stays PENDING -- activation is the webhook's job, not this path
                const row = entityManager.create.mock.calls[0][1] as Record<string, unknown>
                expect(row).toMatchObject({
                    course: null,
                    amount: 199_000,
                    pricingPhase: PricingPhase.Regular,
                    paymentType: PaymentType.PayOS,
                    checkoutUrl: "https://payos/checkout",
                    providerPaymentId: null,
                    status: TransactionStatus.Pending,
                    actionType: ActionType.MembershipPurchase,
                    aiSubTier: null,
                })
                expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-1",
                })
                expect(result).toEqual({
                    checkoutUrl: "https://payos/checkout",
                    referenceId: expect.any(String),
                    transactionId: "txn-1",
                    amount: 199_000,
                    checkoutFields: undefined,
                })
            })

        it("rejects PayOS without both redirect URLs",
            async () => {
                await expect(
                    handler.execute(
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: PaymentType.PayOS,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: undefined,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("signs SePay form fields for the VND membership price",
            async () => {
                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: {
                            paymentType: PaymentType.Sepay,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(sepay.checkout.initOneTimePaymentFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        operation: "PURCHASE",
                        order_amount: 199_000,
                        currency: "VND",
                        success_url: "https://app/ok",
                        cancel_url: "https://app/cancel",
                        error_url: "https://app/cancel",
                    }),
                )
                expect(result.checkoutUrl).toBe("https://sepay/checkout")
                expect(result.checkoutFields).toBe(JSON.stringify({
                    signature: "sig",
                }))
                expect(result.amount).toBe(199_000)
            })

        it("charges the USD membership price in cents through Stripe and stores the session id",
            async () => {
                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: {
                            paymentType: PaymentType.Stripe,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
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
                                    // 8 USD -> 800 cents
                                    unit_amount: 800,
                                }),
                            }),
                        ],
                    }),
                )
                expect(result.checkoutUrl).toBe("https://stripe/checkout")
                // the persisted amount stays the VND reference, not the USD charge
                expect(result.amount).toBe(199_000)
                const row = entityManager.create.mock.calls[0][1] as Record<string, unknown>
                expect(row.providerPaymentId).toBe("cs_test_1")
            })

        it("falls back to an empty checkout URL when Stripe returns a session without one",
            async () => {
                stripe.checkout.sessions.create.mockResolvedValueOnce({
                    id: "cs_test_2",
                    url: null,
                })

                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: {
                            paymentType: PaymentType.Stripe,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
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
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: PaymentType.Stripe,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: undefined,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
            })

        it("never charges the VND price as USD through Stripe when no usable USD price is configured",
            async () => {
                mountFilesystemService.appConfig.mockReturnValueOnce({
                    membership: {
                        enabled: true,
                        priceVnd: 199_000,
                        priceUsd: -1,
                    },
                })

                await expect(
                    handler.execute(
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: PaymentType.Stripe,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(MissingUsdPriceException)

                expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
            })

        it("creates a PayPal order for the USD membership price and stores the order id",
            async () => {
                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: {
                            paymentType: PaymentType.Paypal,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(paypalClient.createOrder).toHaveBeenCalledWith(
                    expect.objectContaining({
                        // PayPal charges USD dollars, not cents
                        amount: 8,
                        returnUrl: "https://app/ok",
                        cancelUrl: "https://app/cancel",
                    }),
                )
                expect(result.checkoutUrl).toBe("https://paypal/approve")
                expect(result.amount).toBe(199_000)
                const row = entityManager.create.mock.calls[0][1] as Record<string, unknown>
                expect(row.providerPaymentId).toBe("pp-order-1")
            })

        it("rejects PayPal without both redirect URLs",
            async () => {
                await expect(
                    handler.execute(
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: PaymentType.Paypal,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: undefined,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(paypalClient.createOrder).not.toHaveBeenCalled()
            })

        it("never charges the VND price as USD through PayPal when no usable USD price is configured",
            async () => {
                mountFilesystemService.appConfig.mockReturnValueOnce({
                    membership: {
                        enabled: true,
                        priceVnd: 199_000,
                        priceUsd: -1,
                    },
                })

                await expect(
                    handler.execute(
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: PaymentType.Paypal,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(MissingUsdPriceException)

                expect(paypalClient.createOrder).not.toHaveBeenCalled()
            })

        it("creates a hosted crypto invoice for the USD membership price and stores the invoice id",
            async () => {
                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: {
                            paymentType: PaymentType.Crypto,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(nowPaymentsClient.createInvoice).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: 8,
                        successUrl: "https://app/ok",
                        cancelUrl: "https://app/cancel",
                    }),
                )
                expect(result.checkoutUrl).toBe("https://nowpayments/invoice")
                expect(result.amount).toBe(199_000)
                const row = entityManager.create.mock.calls[0][1] as Record<string, unknown>
                expect(row.providerPaymentId).toBe("np-invoice-1")
            })

        it("rejects crypto without both redirect URLs",
            async () => {
                await expect(
                    handler.execute(
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: PaymentType.Crypto,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: undefined,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(nowPaymentsClient.createInvoice).not.toHaveBeenCalled()
            })

        it("never charges the VND price as USD through crypto when no usable USD price is configured",
            async () => {
                mountFilesystemService.appConfig.mockReturnValueOnce({
                    membership: {
                        enabled: true,
                        priceVnd: 199_000,
                        priceUsd: -1,
                    },
                })

                await expect(
                    handler.execute(
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: PaymentType.Crypto,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: "https://app/cancel",
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
                        new PurchaseMembershipCommand({
                            request: {
                                paymentType: "momo" as PaymentType,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(UnsupportedPaymentTypeException)

                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("hands back a still-fresh pending membership order instead of charging twice",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "txn-existing",
                    referenceId: "987654",
                    amount: 199_000,
                    checkoutUrl: "https://payos/existing",
                    paymentType: PaymentType.PayOS,
                    // created just now -> inside the reuse window
                    createdAt: new Date(),
                })

                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: {
                            paymentType: PaymentType.PayOS,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // no second gateway checkout and no second pending row
                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(result).toEqual({
                    checkoutUrl: "https://payos/existing",
                    referenceId: "987654",
                    transactionId: "txn-existing",
                    amount: 199_000,
                    // PayOS is a redirect provider -> no signed form fields
                    checkoutFields: undefined,
                })
                expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-existing",
                })
            })

        it("re-signs the SePay fields when the reused pending order is a SePay checkout",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "txn-existing",
                    referenceId: "987655",
                    amount: 199_000,
                    checkoutUrl: "https://sepay/existing",
                    paymentType: PaymentType.Sepay,
                    createdAt: new Date(),
                })

                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: {
                            paymentType: PaymentType.Sepay,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the fields are re-signed from the EXISTING order code + amount
                expect(sepay.checkout.initOneTimePaymentFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        order_invoice_number: "987655",
                        order_amount: 199_000,
                    }),
                )
                expect(result.transactionId).toBe("txn-existing")
                expect(result.checkoutFields).toBe(JSON.stringify({
                    signature: "sig",
                }))
            })

        it("ignores a pending order that has aged past the reuse window and opens a new one",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "txn-stale",
                    referenceId: "987656",
                    amount: 199_000,
                    checkoutUrl: "https://payos/stale",
                    paymentType: PaymentType.PayOS,
                    // far older than the configured reuse window
                    createdAt: new Date(0),
                })

                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: {
                            paymentType: PaymentType.PayOS,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(payos.paymentRequests.create).toHaveBeenCalled()
                expect(result.transactionId).toBe("txn-1")
                expect(result.checkoutUrl).toBe("https://payos/checkout")
            })
    })
