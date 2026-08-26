import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    PAYOS,
} from "@modules/integrations/payos/constants/payos"
import {
    STRIPE,
} from "@modules/integrations/stripe/constants/stripe"
import {
    SEPAY,
} from "@modules/integrations/sepay/constants/sepay"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import {
    TransactionReconcileQueryService,
} from "./transaction-reconcile-query.service"

const transaction = (
    paymentType: PaymentType,
    providerPaymentId: string | null = "provider-1",
): TransactionEntity => ({
    paymentType,
    referenceId: "ref-1",
    providerPaymentId,
}) as TransactionEntity

describe("TransactionReconcileQueryService",
    () => {
        let module: TestingModule
        let service: TransactionReconcileQueryService
        let payosGet: jest.Mock
        let stripeGet: jest.Mock
        let sepayGet: jest.Mock
        let paypalRetrieve: jest.Mock
        let paypalCapture: jest.Mock
        let cryptoGet: jest.Mock

        beforeEach(async () => {
            payosGet = jest.fn()
            stripeGet = jest.fn()
            sepayGet = jest.fn()
            paypalRetrieve = jest.fn()
            paypalCapture = jest.fn()
            cryptoGet = jest.fn()
            module = await Test.createTestingModule({
                providers: [
                    TransactionReconcileQueryService,
                    {
                        provide: PAYOS,
                        useValue: {
                            paymentRequests: {
                                get: payosGet,
                            },
                        },
                    },
                    {
                        provide: STRIPE,
                        useValue: {
                            checkout: {
                                sessions: {
                                    retrieve: stripeGet,
                                },
                            },
                        },
                    },
                    {
                        provide: SEPAY,
                        useValue: {
                            order: {
                                retrieve: sepayGet,
                            },
                        },
                    },
                    {
                        provide: PaypalClient,
                        useValue: {
                            retrieveOrder: paypalRetrieve,
                            captureOrder: paypalCapture,
                        },
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: {
                            getInvoiceStatus: cryptoGet,
                        },
                    },
                ],
            }).compile()
            service = module.get(TransactionReconcileQueryService)
        })

        afterEach(async () => module.close())

        it("separates an unsupported provider from a provider outage",
            async () => {
                await expect(service.resolve(transaction("mystery" as PaymentType)))
                    .resolves.toEqual({
                        state: "unavailable",
                        reason: "unsupported-provider",
                    })
                payosGet.mockRejectedValueOnce(new Error("network down"))
                await expect(service.resolve(transaction(PaymentType.PayOS)))
                    .resolves.toEqual({
                        state: "unavailable",
                        reason: "provider-error",
                    })
            })

        describe("PayOS",
            () => {
                it("returns paid evidence with amount",
                    async () => {
                        payosGet.mockResolvedValueOnce({
                            status: "PAID",
                            amountPaid: 100_000,
                        })
                        await expect(service.resolve(transaction(PaymentType.PayOS)))
                            .resolves.toEqual({
                                state: "paid",
                                providerStatus: "PAID",
                                reportedAmount: 100_000,
                            })
                    })

                it.each(["CANCELLED",
                    "EXPIRED"])("maps %s to terminal-unpaid",
                    async (status) => {
                        payosGet.mockResolvedValueOnce({
                            status,
                        })
                        await expect(service.resolve(transaction(PaymentType.PayOS)))
                            .resolves.toEqual({
                                state: "terminal-unpaid",
                                providerStatus: status,
                            })
                    })

                it.each(["PENDING",
                    "PROCESSING"])("maps %s to pending",
                    async (status) => {
                        payosGet.mockResolvedValueOnce({
                            status,
                        })
                        await expect(service.resolve(transaction(PaymentType.PayOS)))
                            .resolves.toEqual({
                                state: "pending",
                                providerStatus: status,
                            })
                    })

                it("rejects an unknown provider response",
                    async () => {
                        payosGet.mockResolvedValueOnce({
                            status: "ALIEN",
                        })
                        await expect(service.resolve(transaction(PaymentType.PayOS)))
                            .resolves.toEqual({
                                state: "unavailable",
                                reason: "invalid-response",
                            })
                    })

                it("maps a malformed PayOS response to a provider error",
                    async () => {
                        payosGet.mockResolvedValueOnce({
                        })

                        await expect(service.resolve(transaction(PaymentType.PayOS)))
                            .resolves.toEqual({
                                state: "unavailable",
                                reason: "provider-error",
                            })
                    })
            })

        describe("SePay",
            () => {
                it("unwraps nested paid evidence and amount",
                    async () => {
                        sepayGet.mockResolvedValueOnce({
                            data: {
                                data: {
                                    order_status: "CAPTURED",
                                    order_amount: 249_000,
                                },
                            },
                        })
                        await expect(service.resolve(transaction(PaymentType.Sepay)))
                            .resolves.toEqual({
                                state: "paid",
                                providerStatus: "captured",
                                reportedAmount: 249_000,
                            })
                    })

                it.each(["cancelled",
                    "expired",
                    "failed",
                    "voided"])("maps %s to terminal-unpaid",
                    async (status) => {
                        sepayGet.mockResolvedValueOnce({
                            data: {
                                status,
                            },
                        })
                        await expect(service.resolve(transaction(PaymentType.Sepay)))
                            .resolves.toEqual({
                                state: "terminal-unpaid",
                                providerStatus: status,
                            })
                    })

                it("distinguishes pending from an invalid response",
                    async () => {
                        sepayGet
                            .mockResolvedValueOnce({
                                data: {
                                    status: "processing",
                                },
                            })
                            .mockResolvedValueOnce({
                            })
                        await expect(service.resolve(transaction(PaymentType.Sepay)))
                            .resolves.toEqual({
                                state: "pending",
                                providerStatus: "processing",
                            })
                        await expect(service.resolve(transaction(PaymentType.Sepay)))
                            .resolves.toEqual({
                                state: "unavailable",
                                reason: "invalid-response",
                            })
                    })
            })

        describe("Stripe",
            () => {
                it("requires a stored provider id",
                    async () => {
                        await expect(service.resolve(transaction(PaymentType.Stripe,
                            null))).resolves.toEqual({
                            state: "unavailable",
                            reason: "missing-provider-id",
                        })
                        expect(stripeGet).not.toHaveBeenCalled()
                    })

                it.each([
                    [
                        {
                            payment_status: "paid",
                            status: "complete",
                        },
                        {
                            state: "paid",
                            providerStatus: "complete",
                        },
                    ],
                    [
                        {
                            payment_status: "unpaid",
                            status: "expired",
                        },
                        {
                            state: "terminal-unpaid",
                            providerStatus: "expired",
                        },
                    ],
                    [
                        {
                            payment_status: "unpaid",
                            status: "open",
                        },
                        {
                            state: "pending",
                            providerStatus: "open",
                        },
                    ],
                ])("normalizes a Stripe session %#",
                    async (providerResult, expected) => {
                        stripeGet.mockResolvedValueOnce(providerResult)
                        await expect(service.resolve(transaction(PaymentType.Stripe)))
                            .resolves.toEqual(expected)
                    })
            })

        describe("PayPal",
            () => {
                it("requires a stored provider id",
                    async () => {
                        await expect(service.resolve(transaction(PaymentType.Paypal,
                            null))).resolves.toEqual({
                            state: "unavailable",
                            reason: "missing-provider-id",
                        })
                    })

                it("maps completed, voided and created",
                    async () => {
                        paypalRetrieve
                            .mockResolvedValueOnce({
                                status: "COMPLETED",
                            })
                            .mockResolvedValueOnce({
                                status: "VOIDED",
                            })
                            .mockResolvedValueOnce({
                                status: "CREATED",
                            })
                        await expect(service.resolve(transaction(PaymentType.Paypal)))
                            .resolves.toMatchObject({
                                state: "paid",
                            })
                        await expect(service.resolve(transaction(PaymentType.Paypal)))
                            .resolves.toMatchObject({
                                state: "terminal-unpaid",
                            })
                        await expect(service.resolve(transaction(PaymentType.Paypal)))
                            .resolves.toMatchObject({
                                state: "pending",
                            })
                    })

                it.each([true,
                    false])("captures APPROVED and reflects capture=%s",
                    async (captured) => {
                        paypalRetrieve.mockResolvedValueOnce({
                            status: "APPROVED",
                        })
                        paypalCapture.mockResolvedValueOnce({
                            captured,
                        })
                        await expect(service.resolve(transaction(PaymentType.Paypal)))
                            .resolves.toMatchObject({
                                state: captured ? "paid" : "pending",
                            })
                    })
            })

        describe("NOWPayments",
            () => {
                it("requires a stored provider id",
                    async () => {
                        await expect(service.resolve(transaction(PaymentType.Crypto,
                            null))).resolves.toEqual({
                            state: "unavailable",
                            reason: "missing-provider-id",
                        })
                    })

                it.each([true,
                    false])("maps paid=%s without inventing a terminal failure",
                    async (paid) => {
                        cryptoGet.mockResolvedValueOnce({
                            paid,
                        })
                        await expect(service.resolve(transaction(PaymentType.Crypto)))
                            .resolves.toMatchObject({
                                state: paid ? "paid" : "pending",
                            })
                    })
            })
    })
