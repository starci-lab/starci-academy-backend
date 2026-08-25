import {
    CreatePlaygroundSessionHandler
} from "./create-playground-session.handler"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    PlaygroundNotFoundException
} from "@modules/platform/exceptions/errors/courses/playground-not-found"

describe("CreatePlaygroundSessionHandler",
    () => {
        const command = (user?: { id: string }) => ({
            params: {
                request: {
                    playgroundId: "p"
                }, user
            }
        }) as never
        it("rejects unauthenticated requests before lookup",
            async () => {
                const manager = {
                    findOne: jest.fn()
                }
                const handler = new CreatePlaygroundSessionHandler(manager as never,
{
} as never,
{
} as never)
                await expect((handler as unknown as { process(command: unknown): Promise<unknown> }).process(command())).rejects.toBeInstanceOf(UserNotFoundException)
                expect(manager.findOne).not.toHaveBeenCalled()
            })
        it("rejects missing playgrounds",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null)
                }
                const handler = new CreatePlaygroundSessionHandler(manager as never,
{
} as never,
{
} as never)
                await expect((handler as unknown as { process(command: unknown): Promise<unknown> }).process(command({
                    id: "u"
                }))).rejects.toBeInstanceOf(PlaygroundNotFoundException)
            })
    })
