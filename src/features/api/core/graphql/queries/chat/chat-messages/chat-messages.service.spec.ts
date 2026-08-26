import {
    ChatMessagesService
} from "./chat-messages.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"

describe("ChatMessagesService",
    () => {
        it("rejects unauthenticated requests and clamps the page size",
            async () => {
                const listMessages = jest.fn().mockResolvedValue({
                    messages: [], total: 0
                })
                const service = new ChatMessagesService({
                    listMessages
                } as never)

                await expect(service.execute({
                    request: {
                        conversationId: "c1"
                    },
                    user: undefined,
                } as never)).rejects.toBeInstanceOf(UserNotFoundException)
                await expect(service.execute({
                    request: {
                        conversationId: "c1", limit: 999
                    },
                    user: {
                        id: "u1"
                    },
                } as never)).resolves.toEqual({
                    items: [], nextCursor: null
                })
                expect(listMessages).toHaveBeenCalledWith({
                    conversationId: "c1",
                    user: {
                        id: "u1"
                    },
                    offset: 0,
                    limit: 50,
                })
            })

        it("treats malformed and fractional cursors safely and emits a next cursor",
            async () => {
                const listMessages = jest.fn().mockResolvedValue({
                    messages: [],
                    total: 100,
                })
                const service = new ChatMessagesService({
                    listMessages
                } as never)

                const cursor = Buffer.from(JSON.stringify({
                    offset: 2.9
                })).toString("base64url")
                await service.execute({
                    request: {
                        conversationId: "c1", limit: 10, cursor
                    },
                    user: {
                        id: "u1"
                    },
                } as never)
                expect(listMessages).toHaveBeenCalledWith(expect.objectContaining({
                    offset: 2, limit: 10
                }))
                expect((await service.execute({
                    request: {
                        conversationId: "c1", cursor: "not-base64-json"
                    },
                    user: {
                        id: "u1"
                    },
                } as never)).nextCursor).toEqual(expect.any(String))
            })
    })
