import {
    GlobalChatMutationResolver,
} from "./global-chat.resolver"

describe("GlobalChatMutationResolver",
    () => {
        it.each([
            ["send",
                "send"],
            ["react",
                "react"],
            ["edit",
                "edit"],
            ["remove",
                "remove"],
            ["markRead",
                "markRead"],
            ["report",
                "report"],
            ["moderate",
                "moderate"],
            ["setRole",
                "setRole"],
            ["notifications",
                "notifications"],
        ])("delegates %s to the matching chat service operation",
            async (resolverMethod, serviceMethod) => {
                const response = {
                    ok: true,
                }
                const service = {
                    [serviceMethod]: jest.fn().mockResolvedValue(response),
                }
                const resolver = new GlobalChatMutationResolver(service as never)
                const user = {
                    id: "user-1",
                }
                const request = {
                    messageId: "message-1",
                }
                const method = resolver[resolverMethod as keyof GlobalChatMutationResolver] as unknown as (request: unknown, actor: unknown) => Promise<unknown>

                await expect(method.call(resolver,
                    request,
                    user)).resolves.toBe(response)
                expect(service[serviceMethod]).toHaveBeenCalledWith(user,
                    request)
            })

        it("preserves domain failures from the delegated operation",
            async () => {
                const failure = new Error("message is stale")
                const service = {
                    send: jest.fn().mockRejectedValue(failure),
                }
                const resolver = new GlobalChatMutationResolver(service as never)

                await expect(
                    resolver.send(
                        {
                            message: "hello",
                        } as never,
                        {
                            id: "user-1",
                        } as never,
                    ),
                )
                    .rejects.toBe(failure)
                expect(service.send).toHaveBeenCalledWith(
                    {
                        id: "user-1",
                    },
                    {
                        message: "hello",
                    },
                )
            })
    })
