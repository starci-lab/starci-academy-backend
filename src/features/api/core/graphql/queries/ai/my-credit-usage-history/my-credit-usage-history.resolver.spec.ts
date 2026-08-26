import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import type {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    MyCreditUsageHistoryResolver,
} from "./my-credit-usage-history.resolver"

describe("MyCreditUsageHistoryResolver",
    () => {
        it("maps a user's credit history and applies default pagination",
            async () => {
                const createdAt = new Date("2026-01-01T00:00:00.000Z")
                const history = jest.fn().mockResolvedValue({
                    items: [{
                        id: "usage-1", recommendation: "Use concise output", model: "model-1",
                        provider: "provider-1", credits: 3, createdAt, surface: "chat",
                    }],
                    total: 1,
                })
                const resolver = new MyCreditUsageHistoryResolver({
                    history,
                } as unknown as AiEntitlementService)

                await expect(resolver.execute(
                    {
                        id: "user-1",
                    } as unknown as UserEntity,
                    undefined as never,
                    undefined as never,
                )).resolves.toEqual({
                    items: [{
                        id: "usage-1", recommendation: "Use concise output", model: "model-1",
                        provider: "provider-1", credits: 3, createdAt, surface: "chat",
                    }],
                    total: 1,
                })
                expect(history).toHaveBeenCalledWith({
                    userId: "user-1", limit: 50, offset: 0,
                })
            })

        it("clamps lower and upper pagination bounds and propagates history failures",
            async () => {
                const history = jest.fn().mockResolvedValue({
                    items: [], total: 0,
                })
                const resolver = new MyCreditUsageHistoryResolver({
                    history,
                } as unknown as AiEntitlementService)
                const user = {
                    id: "user-1",
                } as unknown as UserEntity

                await expect(resolver.execute(user,
                    -8,
                    -2)).resolves.toEqual({
                    items: [], total: 0,
                })
                expect(history).toHaveBeenLastCalledWith({
                    userId: "user-1", limit: 1, offset: 0,
                })
                await expect(resolver.execute(user,
                    500,
                    7)).resolves.toEqual({
                    items: [], total: 0,
                })
                expect(history).toHaveBeenLastCalledWith({
                    userId: "user-1", limit: 200, offset: 7,
                })

                history.mockRejectedValueOnce(new Error("history unavailable"))
                await expect(resolver.execute(user,
                    10,
                    0)).rejects.toThrow("history unavailable")
            })
    })
