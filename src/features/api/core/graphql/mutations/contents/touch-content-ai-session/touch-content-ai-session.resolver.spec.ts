import {
    TouchContentAiSessionResolver
} from "./touch-content-ai-session.resolver"
describe("TouchContentAiSessionResolver",
    () => { it("returns touched true after delegating",
        async () => { const service = {
            touchSession: jest.fn().mockResolvedValue(undefined)
        }; const resolver = new TouchContentAiSessionResolver(service as never); await expect(resolver.execute({
            contentId: "c"
        } as never,
{
    id: "u"
} as never)).resolves.toEqual({
            touched: true
        }); expect(service.touchSession).toHaveBeenCalled() }) })
