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

        it("preserves reset failures from the companion service",
            async () => {
                const failure = new Error("reset unavailable")
                const resetLearnAiCompanion = jest.fn().mockRejectedValue(failure)

                await expect(new LearnAiCompanionMutationResolver({
                    resetLearnAiCompanion,
                } as never).reset({
                    courseId: "course-1",
                },
                {
                    id: "user-1",
                } as never)).rejects.toBe(failure)
            })

        it("preserves resolve failures without converting the response",
            async () => {
                const failure = new Error("companion unavailable")
                const resolveLearnAiCompanion = jest.fn().mockRejectedValue(failure)

                await expect(new LearnAiCompanionMutationResolver({
                    resolveLearnAiCompanion,
                } as never).resolve({
                    courseId: "course-1"
                },
{
    id: "user-1",
} as never)).rejects.toBe(failure)
            })
    })
