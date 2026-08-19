import {
    PaymentRequestService 
} from "./payment-request.service"

describe("PaymentRequestService",
    () => {
        it("forwards payment status queries without changing the request context",
            async () => {
                const queryBus = {
                    execute: jest.fn().mockResolvedValue({
                        status: "PAID", amount: 100 
                    }) 
                }
                const service = new PaymentRequestService(queryBus as never)
                const params = {
                    user: {
                        id: "u1" 
                    }, paymentId: "pay-1" 
                } as never
                await expect(service.execute(params)).resolves.toEqual({
                    status: "PAID", amount: 100 
                })
                expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({
                    params 
                }))
            })
    })
