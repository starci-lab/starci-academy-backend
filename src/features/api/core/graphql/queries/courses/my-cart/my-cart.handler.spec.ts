import {
    MyCartHandler
} from "./my-cart.handler"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"

describe("MyCartHandler",
    () => {
        it("rejects anonymous queries and returns an empty cart",
            async () => {
                const find = jest.fn().mockResolvedValue([])
                const handler = new MyCartHandler({
                    find
                } as never)
                await expect(handler.execute({
                    params: {
                        user: undefined
                    }
                } as never)).rejects.toBeInstanceOf(UserNotFoundException)
                await expect(handler.execute({
                    params: {
                        user: {
                            id: "u1"
                        }
                    }
                } as never)).resolves.toEqual([])
                expect(find).toHaveBeenCalledTimes(1)
            })

        it("removes enrolled stale rows and keeps non-enrolled rows",
            async () => {
                const items = [{
                    id: "cart-1", courseId: "course-1"
                },
                {
                    id: "cart-2", courseId: "course-2"
                }]
                const find = jest.fn().mockResolvedValueOnce(items).mockResolvedValueOnce([{
                    courseId: "course-1"
                }])
                const remove = jest.fn().mockResolvedValue(undefined)
                const handler = new MyCartHandler({
                    find, delete: remove
                } as never)
                await expect(handler.execute({
                    params: {
                        user: {
                            id: "u1"
                        }
                    }
                } as never)).resolves.toEqual([items[1]])
                expect(remove).toHaveBeenCalledWith(expect.anything(),
                    ["cart-1"])
            })
    })
