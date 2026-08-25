import {
    SetFollowResolver 
} from "./set-follow.resolver"

describe("SetFollowResolver",
    () => {
        it("no-ops self follows without opening a transaction",
            async () => {
                const entityManager = {
                    transaction: jest.fn() 
                }
                const resolver = new SetFollowResolver(entityManager as never,
{
    recompute: jest.fn() 
} as never,
{
    createNotification: jest.fn() 
} as never)
                await expect(resolver.execute({
                    userId: "u1", follow: true 
                },
{
    id: "u1", username: "me" 
} as never)).resolves.toEqual({
                })
                expect(entityManager.transaction).not.toHaveBeenCalled()
            })
    })
