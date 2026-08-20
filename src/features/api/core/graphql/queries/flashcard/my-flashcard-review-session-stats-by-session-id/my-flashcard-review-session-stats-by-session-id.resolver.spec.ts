import {
    MyFlashcardReviewSessionStatsBySessionIdResolver,
} from "./my-flashcard-review-session-stats-by-session-id.resolver"

describe("MyFlashcardReviewSessionStatsBySessionIdResolver",
    () => {
        it("returns null when the recap service cannot resolve the session",
            async () => {
                const service = {
                    find: jest.fn().mockResolvedValue(null),
                }
                const resolver = new MyFlashcardReviewSessionStatsBySessionIdResolver(service as never)

                await expect(resolver.execute({
                    id: "user-1" 
                } as never,
                "session-1")).resolves.toBeNull()
                expect(service.find).toHaveBeenCalledWith({
                    userId: "user-1",
                    sessionId: "session-1",
                })
            })

        it("maps nullable duration and next-due values to GraphQL-safe optional fields",
            async () => {
                const service = {
                    find: jest.fn().mockResolvedValue({
                        sessionId: "session-1",
                        status: "completed",
                        reviewedCount: 3,
                        gradeCounts: {
                            again: 1,
                            hard: 0,
                            good: 1,
                            easy: 1,
                        },
                        durationSeconds: null,
                        xpEarned: 2,
                        nextDueAt: null,
                        weakTags: [{
                            tag: "sql",
                            forgotCount: 1,
                        }],
                    }),
                }
                const resolver = new MyFlashcardReviewSessionStatsBySessionIdResolver(service as never)

                await expect(resolver.execute({
                    id: "user-1" 
                } as never,
                "session-1")).resolves.toEqual({
                    sessionId: "session-1",
                    status: "completed",
                    reviewedCount: 3,
                    gradeCounts: {
                        again: 1,
                        hard: 0,
                        good: 1,
                        easy: 1,
                    },
                    durationSeconds: undefined,
                    xpEarned: 2,
                    nextDueAt: undefined,
                    weakTags: [{
                        tag: "sql",
                        forgotCount: 1,
                    }],
                })
            })

        it("serializes populated duration and next-due values",
            async () => {
                const nextDueAt = new Date("2026-02-03T04:05:06.000Z")
                const service = {
                    find: jest.fn().mockResolvedValue({
                        sessionId: "session-2",
                        status: "in_progress",
                        reviewedCount: 1,
                        gradeCounts: {
                            again: 0,
                            hard: 1,
                            good: 0,
                            easy: 0,
                        },
                        durationSeconds: 12,
                        xpEarned: 0,
                        nextDueAt,
                        weakTags: [],
                    }),
                }
                const resolver = new MyFlashcardReviewSessionStatsBySessionIdResolver(service as never)

                await expect(resolver.execute({
                    id: "user-1" 
                } as never,
                "session-2")).resolves.toEqual(expect.objectContaining({
                    durationSeconds: 12,
                    nextDueAt: nextDueAt.toISOString(),
                }))
            })
    })
