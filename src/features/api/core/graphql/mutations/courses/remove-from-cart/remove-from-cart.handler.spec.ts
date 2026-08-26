import {
    RemoveFromCartHandler
} from "./remove-from-cart.handler"
import {
    RemoveFromCartCommand
} from "./remove-from-cart.command"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"

describe("RemoveFromCartHandler",
    () => {
        it("rejects anonymous requests and returns idempotent removal status",
            async () => {
                const del = jest.fn().mockResolvedValueOnce({
                    affected: 1
                }).mockResolvedValueOnce({
                    affected: 0
                }).mockResolvedValueOnce({
                    affected: null
                })
                const handler = new RemoveFromCartHandler({
                    delete: del
                } as never)
                await expect(handler.execute(new RemoveFromCartCommand({
                    request: {
                        courseId: "c1"
                    }, user: undefined
                } as never))).rejects.toBeInstanceOf(UserNotFoundException)
                await expect(handler.execute(new RemoveFromCartCommand({
                    request: {
                        courseId: "c1"
                    }, user: {
                        id: "u1"
                    }
                } as never))).resolves.toEqual({
                    removed: true
                })
                await expect(handler.execute(new RemoveFromCartCommand({
                    request: {
                        courseId: "c2"
                    }, user: {
                        id: "u1"
                    }
                } as never))).resolves.toEqual({
                    removed: false
                })
                await expect(handler.execute(new RemoveFromCartCommand({
                    request: {
                        courseId: "c3"
                    }, user: {
                        id: "u1"
                    }
                } as never))).resolves.toEqual({
                    removed: false
                })
            })
    })
