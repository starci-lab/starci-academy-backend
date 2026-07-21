import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    TransactionReconcileQueryService,
} from "./transaction-reconcile-query.service"
import {
    PaymentType,
    TransactionEntity,
} from "@modules/databases"
import {
    PAYOS,
} from "@modules/payos"
import {
    STRIPE,
} from "@modules/stripe"
import {
    SEPAY,
} from "@modules/sepay"
import {
    PaypalClient,
} from "@modules/paypal"
import {
    NowPaymentsClient,
} from "@modules/nowpayments"

/**
 * Build a pending transaction for a given gateway with the id columns the
 * reconcile path reads (`referenceId`, `providerPaymentId`).
 *
 * @param overrides - Partial fields to merge over the defaults.
 * @returns A transaction-shaped object accepted by `resolve`.
 */
const buildTransaction = (
    overrides: Partial<{
        paymentType: PaymentType
        referenceId: string
        providerPaymentId: string | null
    }> = {
    },
): TransactionEntity => ({
    paymentType: PaymentType.PayOS,
    referenceId: "ref-1",
    providerPaymentId: "provider-1",
    ...overrides,
}) as unknown as TransactionEntity

describe("TransactionReconcileQueryService",
    () => {
        let module: TestingModule
        let service: TransactionReconcileQueryService
        let payos: { paymentRequests: { get: jest.Mock } }
        let stripe: { checkout: { sessions: { retrieve: jest.Mock } } }
        let sepay: { order: { retrieve: jest.Mock } }
        let paypalClient: jest.Mocked<Pick<PaypalClient, "retrieveOrder" | "captureOrder">>
        let nowPaymentsClient: jest.Mocked<Pick<NowPaymentsClient, "getInvoiceStatus">>

        beforeEach(async () => {
            // PayOS SDK: payment-link lookup by orderCode
            payos = {
                paymentRequests: {
                    get: jest.fn(),
                },
            }

            // Stripe SDK: checkout-session retrieve by id
            stripe = {
                checkout: {
                    sessions: {
                        retrieve: jest.fn(),
                    },
                },
            }

            // Sepay SDK: order-detail retrieve by invoice number
            sepay = {
                order: {
                    retrieve: jest.fn(),
                },
            }

            // PayPal client wrapper: order retrieve by id + APPROVED-order capture fallback
            paypalClient = {
                retrieveOrder: jest.fn(),
                captureOrder: jest.fn(),
            } as unknown as jest.Mocked<Pick<PaypalClient, "retrieveOrder" | "captureOrder">>

            // NOWPayments client wrapper: invoice status by id
            nowPaymentsClient = {
                getInvoiceStatus: jest.fn(),
            } as unknown as jest.Mocked<Pick<NowPaymentsClient, "getInvoiceStatus">>

            module = await Test.createTestingModule({
                providers: [
                    TransactionReconcileQueryService,
                    {
                        provide: PAYOS,
                        useValue: payos,
                    },
                    {
                        provide: STRIPE,
                        useValue: stripe,
                    },
                    {
                        provide: SEPAY,
                        useValue: sepay,
                    },
                    {
                        provide: PaypalClient,
                        useValue: paypalClient,
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: nowPaymentsClient,
                    },
                ],
            }).compile()

            service = module.get<TransactionReconcileQueryService>(
                TransactionReconcileQueryService,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        describe("resolve — dispatch",
            () => {
                it("returns unknown for an unrecognized payment type",
                    async () => {
                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: "mystery" as PaymentType,
                            }),
                        )

                        expect(result).toBe("unknown")
                    })

                it("swallows a thrown gateway error into unknown so the poll keeps retrying",
                    async () => {
                        // the SDK call blows up; the service must not propagate it
                        payos.paymentRequests.get.mockRejectedValueOnce(
                            new Error("network down"),
                        )

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.PayOS,
                            }),
                        )

                        expect(result).toBe("unknown")
                    })
            })

        describe("resolve — PayOS",
            () => {
                it("maps a PAID link to paid",
                    async () => {
                        payos.paymentRequests.get.mockResolvedValueOnce({
                            status: "PAID",
                        })

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.PayOS,
                            }),
                        )

                        // looked up by the stored orderCode (referenceId)
                        expect(payos.paymentRequests.get).toHaveBeenCalledWith("ref-1")
                        expect(result).toBe("paid")
                    })

                it("maps CANCELLED and EXPIRED to unpaid",
                    async () => {
                        payos.paymentRequests.get
                            .mockResolvedValueOnce({
                                status: "CANCELLED",
                            })
                            .mockResolvedValueOnce({
                                status: "EXPIRED",
                            })

                        const cancelled = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.PayOS,
                            }),
                        )
                        const expired = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.PayOS,
                            }),
                        )

                        expect(cancelled).toBe("unpaid")
                        expect(expired).toBe("unpaid")
                    })

                it("maps a still-pending link to unknown",
                    async () => {
                        payos.paymentRequests.get.mockResolvedValueOnce({
                            status: "PENDING",
                        })

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.PayOS,
                            }),
                        )

                        expect(result).toBe("unknown")
                    })
            })

        describe("resolve — Sepay",
            () => {
                it("trusts an explicit paid boolean",
                    async () => {
                        sepay.order.retrieve.mockResolvedValueOnce({
                            data: {
                                paid: true,
                            },
                        })

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Sepay,
                            }),
                        )

                        expect(sepay.order.retrieve).toHaveBeenCalledWith("ref-1")
                        expect(result).toBe("paid")
                    })

                it("maps a settled status string to paid",
                    async () => {
                        sepay.order.retrieve.mockResolvedValueOnce({
                            data: {
                                status: "Completed",
                            },
                        })

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Sepay,
                            }),
                        )

                        expect(result).toBe("paid")
                    })

                it("maps a terminal failure status to unpaid",
                    async () => {
                        sepay.order.retrieve.mockResolvedValueOnce({
                            data: {
                                status: "expired",
                            },
                        })

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Sepay,
                            }),
                        )

                        expect(result).toBe("unpaid")
                    })

                it("maps an unrecognized / missing payload to unknown",
                    async () => {
                        // no data envelope at all → defensive read yields unknown
                        sepay.order.retrieve.mockResolvedValueOnce({
                        })

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Sepay,
                            }),
                        )

                        expect(result).toBe("unknown")
                    })
            })

        describe("resolve — Stripe",
            () => {
                it("returns unknown when no session id was stored at checkout",
                    async () => {
                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Stripe,
                                providerPaymentId: null,
                            }),
                        )

                        // missing id → never call the SDK
                        expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled()
                        expect(result).toBe("unknown")
                    })

                it("maps a paid payment_status to paid",
                    async () => {
                        stripe.checkout.sessions.retrieve.mockResolvedValueOnce({
                            payment_status: "paid",
                            status: "complete",
                        })

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Stripe,
                            }),
                        )

                        expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
                            "provider-1",
                        )
                        expect(result).toBe("paid")
                    })

                it("maps an expired session to unpaid",
                    async () => {
                        stripe.checkout.sessions.retrieve.mockResolvedValueOnce({
                            payment_status: "unpaid",
                            status: "expired",
                        })

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Stripe,
                            }),
                        )

                        expect(result).toBe("unpaid")
                    })

                it("maps an open session to unknown",
                    async () => {
                        stripe.checkout.sessions.retrieve.mockResolvedValueOnce({
                            payment_status: "unpaid",
                            status: "open",
                        })

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Stripe,
                            }),
                        )

                        expect(result).toBe("unknown")
                    })
            })

        describe("resolve — PayPal",
            () => {
                it("returns unknown when no order id was stored at checkout",
                    async () => {
                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Paypal,
                                providerPaymentId: null,
                            }),
                        )

                        expect(paypalClient.retrieveOrder).not.toHaveBeenCalled()
                        expect(result).toBe("unknown")
                    })

                it("maps a COMPLETED order to paid without attempting a capture",
                    async () => {
                        // funds already taken → no fallback capture needed
                        paypalClient.retrieveOrder.mockResolvedValueOnce({
                            status: "COMPLETED",
                        } as never)

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Paypal,
                            }),
                        )

                        expect(paypalClient.retrieveOrder).toHaveBeenCalledWith({
                            orderId: "provider-1",
                        })
                        expect(paypalClient.captureOrder).not.toHaveBeenCalled()
                        expect(result).toBe("paid")
                    })

                it("captures an APPROVED order and maps a successful capture to paid",
                    async () => {
                        // approved-but-not-captured → the fallback capture must run
                        paypalClient.retrieveOrder.mockResolvedValueOnce({
                            status: "APPROVED",
                        } as never)
                        paypalClient.captureOrder.mockResolvedValueOnce({
                            captured: true,
                        } as never)

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Paypal,
                            }),
                        )

                        expect(paypalClient.captureOrder).toHaveBeenCalledWith({
                            orderId: "provider-1",
                        })
                        expect(result).toBe("paid")
                    })

                it("maps an APPROVED order whose capture did not complete to unknown",
                    async () => {
                        // capture ran but PayPal did not report the funds as taken
                        paypalClient.retrieveOrder.mockResolvedValueOnce({
                            status: "APPROVED",
                        } as never)
                        paypalClient.captureOrder.mockResolvedValueOnce({
                            captured: false,
                        } as never)

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Paypal,
                            }),
                        )

                        expect(result).toBe("unknown")
                    })

                it("maps a VOIDED order to unpaid",
                    async () => {
                        paypalClient.retrieveOrder.mockResolvedValueOnce({
                            status: "VOIDED",
                        } as never)

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Paypal,
                            }),
                        )

                        expect(result).toBe("unpaid")
                    })

                it("maps a still-open order to unknown",
                    async () => {
                        paypalClient.retrieveOrder.mockResolvedValueOnce({
                            status: "CREATED",
                        } as never)

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Paypal,
                            }),
                        )

                        expect(result).toBe("unknown")
                    })
            })

        describe("resolve — Crypto (NOWPayments)",
            () => {
                it("returns unknown when no invoice id was stored at checkout",
                    async () => {
                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Crypto,
                                providerPaymentId: null,
                            }),
                        )

                        expect(nowPaymentsClient.getInvoiceStatus).not.toHaveBeenCalled()
                        expect(result).toBe("unknown")
                    })

                it("maps a paid invoice to paid",
                    async () => {
                        nowPaymentsClient.getInvoiceStatus.mockResolvedValueOnce({
                            paid: true,
                        } as never)

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Crypto,
                            }),
                        )

                        expect(nowPaymentsClient.getInvoiceStatus).toHaveBeenCalledWith(
                            "provider-1",
                        )
                        expect(result).toBe("paid")
                    })

                it("keeps a not-yet-paid invoice as unknown (never unpaid from here)",
                    async () => {
                        nowPaymentsClient.getInvoiceStatus.mockResolvedValueOnce({
                            paid: false,
                        } as never)

                        const result = await service.resolve(
                            buildTransaction({
                                paymentType: PaymentType.Crypto,
                            }),
                        )

                        expect(result).toBe("unknown")
                    })
            })
    })
