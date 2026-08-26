import {
    GlobalChatResolver,
} from "./global-chat.resolver"

describe("GlobalChatResolver",
    () => {
        it("delegates room, messages, and moderation queue reads with actor context",
            async () => {
                const response = {
                    ok: true,
                }
                const service = {
                    room: jest.fn().mockResolvedValue(response),
                    messages: jest.fn().mockResolvedValue(response),
                    moderationQueue: jest.fn().mockResolvedValue(response),
                }
                const resolver = new GlobalChatResolver(service as never)
                const user = {
                    id: "user-1",
                }
                const request = {
                    limit: 10,
                }

                await expect(resolver.room(user as never)).resolves.toBe(response)
                await expect(resolver.messages(request as never,
                    user as never)).resolves.toBe(response)
                await expect(resolver.moderationQueue(request as never,
                    user as never)).resolves.toBe(response)

                expect(service.room).toHaveBeenCalledWith(user)
                expect(service.messages).toHaveBeenCalledWith(user,
                    request)
                expect(service.moderationQueue).toHaveBeenCalledWith(user,
                    request)
            })

        it("preserves a query-service failure without rewriting it",
            async () => {
                const failure = new Error("chat read failed")
                const service = {
                    room: jest.fn().mockRejectedValue(failure),
                    messages: jest.fn(),
                    moderationQueue: jest.fn(),
                }
                const resolver = new GlobalChatResolver(service as never)

                await expect(resolver.room({
                    id: "user-1",
                } as never)).rejects.toBe(failure)
                expect(service.messages).not.toHaveBeenCalled()
            })
    })
