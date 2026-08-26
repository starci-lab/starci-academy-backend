import {
    PurchaseAiSubscriptionService
} from "./purchase-ai-subscription.service"

describe("PurchaseAiSubscriptionService",
    () => {
        it("forwards the request through a command",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    id: "subscription"
                })
                const params = {
                    user: {
                        id: "u-1"
                    }, request: {
                        plan: "pro"
                    }
                }
                await expect(new PurchaseAiSubscriptionService({
                    execute
                } as never).execute(params as never)).resolves.toEqual({
                    id: "subscription"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
            })
    })
