import {
    CoursesCheckoutService
} from "./courses-checkout.service"

describe("CoursesCheckoutService",
    () => {
        it("forwards checkout params and preserves command results/errors",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    paymentUrl: "url"
                })
                const service = new CoursesCheckoutService({
                    execute
                } as never)
                const params = {
                    request: {
                        courseIds: ["c1"]
                    }, user: {
                        id: "u1"
                    }
                } as never
                await expect(service.execute(params)).resolves.toEqual({
                    paymentUrl: "url"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
                execute.mockRejectedValueOnce(new Error("gateway"))
                await expect(service.execute({
                    request: {
                        courseIds: []
                    }, user: {
                        id: "u1"
                    }
                } as never)).rejects.toThrow("gateway")
            })
    })
