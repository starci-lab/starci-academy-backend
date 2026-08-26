import {
    NowPaymentsWebhookController,
} from "./webhook.controller"

describe("NowPaymentsWebhookController",
    () => {
        it("logs a received payment and forwards the signature",
            async () => {
                const service = {
                    execute: jest.fn().mockResolvedValue({
                        accepted: true,
                    }),
                }
                const winston = {
                    log: jest.fn(),
                }
                const body = {
                    order_id: "order-1",
                    payment_id: 42,
                    payment_status: "finished",
                }

                const result = await new NowPaymentsWebhookController(service as never,
                    winston as never).webhook(body as never,
                    "signature")

                expect(result).toEqual({
                    accepted: true,
                })
                expect(service.execute).toHaveBeenCalledWith({
                    body,
                    signature: "signature",
                })
                expect(winston.log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        op: "nowpayments.webhook.received",
                        referenceId: "order-1",
                        meta: expect.objectContaining({
                            paymentId: "42",
                            signaturePresent: true,
                        }),
                    }))
            })

        it("normalizes an absent signature and payment id while preserving service errors",
            async () => {
                const failure = new Error("invalid signature")
                const service = {
                    execute: jest.fn().mockRejectedValue(failure),
                }
                const winston = {
                    log: jest.fn(),
                }
                const body = {
                    order_id: "order-2",
                    payment_id: null,
                    payment_status: "waiting",
                }

                await expect(new NowPaymentsWebhookController(service as never,
                    winston as never).webhook(body as never,
                    undefined as never)).rejects.toBe(failure)
                expect(service.execute).toHaveBeenCalledWith({
                    body,
                    signature: "",
                })
                expect(winston.log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        referenceId: "order-2",
                        meta: expect.objectContaining({
                            paymentId: undefined,
                            signaturePresent: false,
                        }),
                    }))
            })
    })
