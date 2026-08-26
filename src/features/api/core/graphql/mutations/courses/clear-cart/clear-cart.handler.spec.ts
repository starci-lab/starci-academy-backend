import {
    ClearCartHandler
} from "./clear-cart.handler"
import {
    ClearCartCommand
} from "./clear-cart.command"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"

describe("ClearCartHandler",
    () => {
        it("rejects anonymous clears and reports affected or zero rows",
            async () => {
                const del = jest.fn().mockResolvedValueOnce({
                    affected: 3
                }).mockResolvedValueOnce({
                    affected: null
                })
                const handler = new ClearCartHandler({
                    delete: del
                } as never)
                await expect(handler.execute(new ClearCartCommand({
                    user: undefined
                } as never))).rejects.toBeInstanceOf(UserNotFoundException)
                await expect(handler.execute(new ClearCartCommand({
                    user: {
                        id: "u1"
                    }
                } as never))).resolves.toEqual({
                    removedCount: 3
                })
                await expect(handler.execute(new ClearCartCommand({
                    user: {
                        id: "u1"
                    }
                } as never))).resolves.toEqual({
                    removedCount: 0
                })
            })
    })
