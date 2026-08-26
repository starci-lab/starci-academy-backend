import {
    AddToCartHandler
} from "./add-to-cart.handler"
import {
    AddToCartCommand
} from "./add-to-cart.command"
import {
    CourseNotFoundException
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    CourseAlreadyEnrolledException
} from "@modules/platform/exceptions/errors/courses/course-already-enrolled"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"

describe("AddToCartHandler",
    () => {
        const command = (courseId: string) => new AddToCartCommand({
            request: {
                courseId
            }, user: {
                id: "u1"
            }
        } as never)

        it("rejects missing and already-enrolled courses",
            async () => {
                const exists = jest.fn().mockResolvedValueOnce(false)
                const handler = new AddToCartHandler({
                    exists
                } as never)
                await expect(handler.execute(command("missing"))).rejects.toBeInstanceOf(CourseNotFoundException)
                exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true)
                await expect(handler.execute(command("owned"))).rejects.toBeInstanceOf(CourseAlreadyEnrolledException)
            })

        it("rejects anonymous callers before querying course state",
            async () => {
                const exists = jest.fn()
                const handler = new AddToCartHandler({
                    exists
                } as never)
                await expect(handler.execute(new AddToCartCommand({
                    request: {
                        courseId: "c1"
                    }, user: undefined
                } as never))).rejects.toBeInstanceOf(UserNotFoundException)
                expect(exists).not.toHaveBeenCalled()
            })

        it("returns an existing cart item or creates a new one",
            async () => {
                const existing = {
                    id: "cart-1"
                }
                const create = jest.fn().mockReturnValue({
                    id: "draft"
                })
                const save = jest.fn().mockResolvedValue({
                    id: "cart-2"
                })
                const exists = jest
                    .fn()
                    .mockResolvedValueOnce(true)
                    .mockResolvedValueOnce(false)
                    .mockResolvedValueOnce(true)
                    .mockResolvedValueOnce(false)
                const findOne = jest.fn().mockResolvedValueOnce(existing).mockResolvedValueOnce(null)
                const handler = new AddToCartHandler({
                    exists, findOne, create, save
                } as never)
                await expect(handler.execute(command("one"))).resolves.toBe(existing)
                await expect(handler.execute(command("two"))).resolves.toEqual({
                    id: "cart-2"
                })
                expect(create).toHaveBeenCalled()
                expect(save).toHaveBeenCalledWith({
                    id: "draft"
                })
            })
    })
