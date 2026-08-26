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

        it("forwards the authenticated user and exact request to moderation",
            async () => {
                const response = {
                    ok: true,
                    action: "removed",
                }
                const moderate = jest.fn().mockResolvedValue(response)
                const resolver = new GlobalChatMutationResolver({
                    moderate,
                } as never)
                const user = {
                    id: "admin-1",
                }
                const request = {
                    messageId: "message-9",
                    decision: "remove",
                }

                await expect(resolver.moderate(request as never,
                    user as never)).resolves.toBe(response)
                expect(moderate).toHaveBeenCalledWith(user,
                    request)
            })

        it("preserves a role-update failure and does not rewrite its domain error",
            async () => {
                const failure = new Error("role update denied")
                const setRole = jest.fn().mockRejectedValue(failure)
                const resolver = new GlobalChatMutationResolver({
                    setRole
                } as never)
                const request = {
                    targetUserId: "member-2",
                    role: "moderator",
                }
                const user = {
                    id: "admin-1"
                }

                await expect(resolver.setRole(request as never,
                    user as never)).rejects.toBe(failure)
                expect(setRole).toHaveBeenCalledWith(user,
                    request)
            })

        it("forwards notification preference failures unchanged",
            async () => {
                const failure = new Error("preference update failed")
                const notifications = jest.fn().mockRejectedValue(failure)
                const resolver = new GlobalChatMutationResolver({
                    notifications,
                } as never)

                await expect(resolver.notifications({
                    enabled: true,
                } as never,
                {
                    id: "user-1",
                } as never)).rejects.toBe(failure)
                expect(notifications).toHaveBeenCalledWith(
                    {
                        id: "user-1",
                    },
                    {
                        enabled: true,
                    },
                )
            })
    })
