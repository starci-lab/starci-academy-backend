import {
    PaypalWebhookController,
} from "./webhook.controller"

describe("PaypalWebhookController",
    () => {
        it("forwards the body and all signature headers to the webhook service",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    accepted: true,
                })
                const log = jest.fn()
                const controller = new PaypalWebhookController({
                    execute,
                } as never,
                {
                    log,
                } as never)
                const body = {
                    event_type: "PAYMENT.CAPTURE.COMPLETED",
                    resource: {
                        id: "capture-1",
                    },
                }

                await expect(controller.webhook(body as never,
                    "sha256",
                    "https://paypal.test/cert",
                    "transmission-1",
                    "signature-1",
                    "2026-08-26T00:00:00Z")).resolves.toEqual({
                    accepted: true,
                })
                expect(execute).toHaveBeenCalledWith({
                    body,
                    authAlgo: "sha256",
                    certUrl: "https://paypal.test/cert",
                    transmissionId: "transmission-1",
                    transmissionSig: "signature-1",
                    transmissionTime: "2026-08-26T00:00:00Z",
                })
                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        meta: expect.objectContaining({
                            eventType: "PAYMENT.CAPTURE.COMPLETED",
                            signaturePresent: true,
                        }),
                    }))
            })
        it("normalizes missing signature headers before delegation",
            async () => {
                const execute = jest.fn().mockResolvedValue(null)
                const controller = new PaypalWebhookController({
                    execute,
                } as never,
                {
                    log: jest.fn(),
                } as never)

                await controller.webhook({
                    event_type: "UNKNOWN",
                } as never,
                undefined as never,
                undefined as never,
                undefined as never,
                undefined as never,
                undefined as never)

                expect(execute).toHaveBeenCalledWith({
                    body: {
                        event_type: "UNKNOWN",
                    },
                    authAlgo: "",
                    certUrl: "",
                    transmissionId: "",
                    transmissionSig: "",
                    transmissionTime: "",
                })
            })
    })
