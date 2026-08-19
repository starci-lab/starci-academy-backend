import {
    NowPaymentsWebhookService 
} from "./webhook.service"

describe("NowPaymentsWebhookService",
    () => {
        it("dispatches the IPN and preserves command-bus failures",
            async () => {
                const error = new Error("queue unavailable")
                const commandBus = {
                    execute: jest.fn().mockRejectedValue(error) 
                }
                const service = new NowPaymentsWebhookService(commandBus as never)
                const params = {
                    body: {
                        order_id: "txn-1" 
                    }, signature: "sig" 
                } as never
                await expect(service.execute(params)).rejects.toBe(error)
                expect(commandBus.execute).toHaveBeenCalledWith(expect.objectContaining({
                    params 
                }))
            })
    })
