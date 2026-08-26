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
    })
