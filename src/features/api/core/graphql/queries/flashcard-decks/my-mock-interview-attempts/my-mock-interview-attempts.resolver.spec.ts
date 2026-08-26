import {
    MyMockInterviewAttemptsResolver
} from "./my-mock-interview-attempts.resolver"
import type {
    MockInterviewAttemptSummary
} from "./types/my-mock-interview-attempts"

describe("MyMockInterviewAttemptsResolver",
    () => {
        it("clamps paging, forwards mode, and serializes dates",
            async () => {
                const service = {
                    list: jest.fn()
                }
                const resolver = new MyMockInterviewAttemptsResolver(service as never)
                const attempt: MockInterviewAttemptSummary = {
                    id: "attempt", sessionId: "session", promptId: "prompt", promptTitle: "Prompt", level: null, mode: "qna", overallScore: 80, verdict: "pass", phaseScores: [], attributeScores: [], strengths: [], gaps: [], followUpQuestion: null, matchedContentIds: [], questionReviews: [], createdAt: new Date("2026-01-02T03:04:05.000Z"), name: null,
                }
                service.list.mockResolvedValue({
                    totalCount: 1, items: [attempt]
                })
                await expect(resolver.execute({
                    id: "user"
                } as never,
                "course",
                999,
                -5,
                "qna")).resolves.toEqual({
                    totalCount: 1, items: [expect.objectContaining({
                        id: "attempt", createdAt: "2026-01-02T03:04:05.000Z"
                    })]
                })
                expect(service.list).toHaveBeenCalledWith({
                    userId: "user", courseId: "course", limit: 50, offset: 0, mode: "qna"
                })
            })
        it("uses defaults and omits null mode",
            async () => {
                const service = {
                    list: jest.fn().mockResolvedValue({
                        totalCount: 0, items: []
                    })
                }
                const resolver = new MyMockInterviewAttemptsResolver(service as never)
                await expect(resolver.execute({
                    id: "user"
                } as never,
                "course",
                null,
                null,
                null)).resolves.toEqual({
                    totalCount: 0, items: []
                })
                expect(service.list).toHaveBeenCalledWith({
                    userId: "user", courseId: "course", limit: 10, offset: 0, mode: undefined
                })
            })

        it("preserves nullable scorecard fields while mapping an attempt",
            async () => {
                const service = {
                    list: jest.fn().mockResolvedValue({
                        totalCount: 1,
                        items: [{
                            id: "attempt-2",
                            sessionId: "session-2",
                            promptId: "prompt-2",
                            promptTitle: "Design",
                            level: null,
                            mode: "design",
                            overallScore: null,
                            verdict: null,
                            phaseScores: [],
                            attributeScores: [],
                            strengths: [],
                            gaps: [],
                            followUpQuestion: null,
                            matchedContentIds: [],
                            questionReviews: [],
                            createdAt: new Date(0),
                            name: null,
                        }],
                    }),
                }
                const result = await new MyMockInterviewAttemptsResolver(service as never).execute({
                    id: "user",
                } as never,
                "course",
                1,
                0,
                "design" as never)

                expect(result.items[0]).toEqual(expect.objectContaining({
                    id: "attempt-2",
                    overallScore: null,
                    verdict: null,
                    createdAt: new Date(0).toISOString(),
                }))
            })
    })
