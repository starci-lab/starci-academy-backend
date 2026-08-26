import {
    LearnAiCompanionMutationResolver
} from "./learn-ai-companion.resolver"

describe("LearnAiCompanionMutationResolver",
    () => {
        it("resolves an existing and absent companion",
            async () => {
                const service = {
                    resolveLearnAiCompanion: jest.fn().mockResolvedValueOnce({
                        id: "session"
                    }).mockResolvedValueOnce(null)
                }
                const resolver = new LearnAiCompanionMutationResolver(service as never)
                await expect(resolver.resolve({
                    courseId: "course"
                },
{
    id: "user"
} as never)).resolves.toEqual({
                    sessionId: "session"
                })
                await expect(resolver.resolve({
                    courseId: "course"
                },
{
    id: "user"
} as never)).resolves.toEqual({
                    sessionId: null
                })
                expect(service.resolveLearnAiCompanion).toHaveBeenCalledWith({
                    userId: "user", courseId: "course"
                })
            })
        it("delegates reset and returns its service response",
            async () => {
                const response = {
                    id: "new"
                }
                const service = {
                    resetLearnAiCompanion: jest.fn().mockResolvedValue(response)
                }
                await expect(new LearnAiCompanionMutationResolver(service as never).reset({
                    courseId: "course"
                },
{
    id: "user"
} as never)).resolves.toBe(response)
            })
    })
