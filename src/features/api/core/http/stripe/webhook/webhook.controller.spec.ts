import {
    StripeWebhookController,
} from "./webhook.controller"

describe("StripeWebhookController",
    () => {
        it("forwards the raw body and signature while logging its byte length",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    accepted: true,
                })
                const log = jest.fn()
                const rawBody = Buffer.from("{\"event\":\"checkout.session.completed\"}")
                const result = await new StripeWebhookController({
                    execute,
                } as never,
                {
                    log,
                } as never).webhook({
                    rawBody,
                } as never,
                "stripe-signature")

                expect(result).toEqual({
                    accepted: true,
                })
                expect(execute).toHaveBeenCalledWith({
                    rawBody,
                    signature: "stripe-signature",
                })
                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        op: "stripe.webhook.received",
                        meta: expect.objectContaining({
                            rawBodyBytes: rawBody.length,
                            signaturePresent: true,
                        }),
                    }))
            })

        it("uses an empty raw body and signature when the HTTP adapter omits them",
            async () => {
                const execute = jest.fn().mockResolvedValue(null)
                const controller = new StripeWebhookController({
                    execute,
                } as never,
                {
                    log: jest.fn(),
                } as never)

                await controller.webhook({
                } as never,
                    undefined as never)

                expect(execute).toHaveBeenCalledWith({
                    rawBody: Buffer.from(""),
                    signature: "",
                })
            })
    })
