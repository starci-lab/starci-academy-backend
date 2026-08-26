import {
    SetAiCeilResolver
} from "./set-ai-ceil.resolver"

describe("SetAiCeilResolver",
    () => {
        it("sets explicit surface/category and returns an empty payload",
            async () => {
                const setCeil = jest.fn().mockResolvedValue(undefined)
                const result = await new SetAiCeilResolver({
                    setCeil
                } as never).execute({
                    surface: "chat", category: "coding"
                } as never,
{
    id: "user-1"
} as never)
                expect(result).toEqual({
                })
                expect(setCeil).toHaveBeenCalledWith({
                    userId: "user-1", surface: "chat", category: "coding"
                })
            })

        it("normalizes omitted optional values to null",
            async () => {
                const setCeil = jest.fn().mockResolvedValue(undefined)
                await new SetAiCeilResolver({
                    setCeil
                } as never).execute({
                } as never,
{
    id: "user-1"
} as never)
                expect(setCeil).toHaveBeenCalledWith({
                    userId: "user-1", surface: null, category: null
                })
            })

        it("propagates entitlement validation errors",
            async () => {
                const setCeil = jest.fn().mockRejectedValue(new Error("invalid category"))
                await expect(new SetAiCeilResolver({
                    setCeil
                } as never).execute({
                },
{
    id: "user-1"
} as never)).rejects.toThrow("invalid category")
            })
    })
