import {
    RefundCoursePurchaseService
} from "./refund-course-purchase.service"

describe("RefundCoursePurchaseService",
    () => {
        it("dispatches refund context and preserves rejected gateway errors",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    refunded: true
                })
                const service = new RefundCoursePurchaseService({
                    execute
                } as never)
                await expect(service.execute({
                    request: {
                        enrollmentId: "e1", reason: "requested"
                    }, user: {
                        id: "u1"
                    }
                } as never)).resolves.toEqual({
                    refunded: true
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params: expect.objectContaining({
                        request: {
                            enrollmentId: "e1", reason: "requested"
                        }, user: {
                            id: "u1"
                        }
                    })
                }))
                execute.mockRejectedValueOnce(new Error("payment unavailable"))
                await expect(service.execute({
                    request: {
                        enrollmentId: "e1", reason: "requested"
                    }, user: {
                        id: "u1"
                    }
                } as never)).rejects.toThrow("payment unavailable")
            })
    })
