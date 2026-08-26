import {
    MyKpisResolver
} from "./my-kpis.resolver"

describe("MyKpisResolver",
    () => {
        it("builds KPI items and composite progress from projection and floor state",
            async () => {
                const stats = {
                    weekResetAt: "2026-08-24T00:00:00.000Z", challengesCompleted: 3, minutesLearned: 10, coursesCompleted: 0, commentsCreated: 0, streakDays: 0
                }
                const projection = {
                    getStats: jest.fn().mockResolvedValue(stats)
                }
                const rewards = {
                    getFloorStates: jest.fn().mockResolvedValue({
                    })
                }
                const resolver = new MyKpisResolver(projection as never,
rewards as never)
                const result = await resolver.execute({
                    id: "u1", weeklyKpiTargets: {
                    }
                } as never)
                expect(result.items.length).toBeGreaterThan(0)
                expect(result.composite).toEqual({
                    percent: 0, completed: 0, total: 0
                })
                expect(rewards.getFloorStates).toHaveBeenCalledWith({
                    userId: "u1", currentTargets: {
                    }
                })
            })
        it("maps positive targets and floor claims into completion and claimability",
            async () => {
                const resolver = new MyKpisResolver({
                    getStats: jest.fn().mockResolvedValue({
                        weekResetAt: "2026-08-24T00:00:00.000Z",
                        weeklyChallenges: 5,
                        weeklyLessons: 2,
                        weeklyStudyDays: 0,
                        weeklyCoding: 0,
                        weeklyFlashcards: 0,
                        weeklyMilestones: 0,
                    }),
                } as never,
                {
                    getFloorStates: jest.fn().mockResolvedValue({
                        challenges: {
                            floorTarget: 3,
                            claimed: false,
                        },
                        lessons: {
                            floorTarget: 10,
                            claimed: true,
                        },
                    }),
                } as never)

                const result = await resolver.execute({
                    id: "u1",
                    weeklyKpiTargets: {
                        challenges: 4,
                        lessons: 10,
                    },
                } as never)
                const challenge = result.items.find((item) => item.key === "challenges")
                const minutes = result.items.find((item) => item.key === "lessons")
                expect(challenge).toEqual(expect.objectContaining({
                    target: 4,
                    claimed: false,
                    canClaim: true,
                }))
                expect(minutes).toEqual(expect.objectContaining({
                    target: 10,
                    claimed: true,
                    canClaim: false,
                }))
                expect(result.composite.total).toBe(2)
                expect(result.composite.completed).toBe(1)
            })

        it("does not allow an unclaimed KPI below its floor to be claimed",
            async () => {
                const resolver = new MyKpisResolver({
                    getStats: jest.fn().mockResolvedValue({
                        weekResetAt: "2026-08-24T00:00:00.000Z",
                        weeklyChallenges: 1,
                        weeklyLessons: 0,
                        weeklyStudyDays: 0,
                        weeklyCoding: 0,
                        weeklyFlashcards: 0,
                        weeklyMilestones: 0,
                    }),
                } as never,
                {
                    getFloorStates: jest.fn().mockResolvedValue({
                        challenges: {
                            floorTarget: 3,
                            claimed: false,
                        },
                    }),
                } as never)

                const result = await resolver.execute({
                    id: "u1",
                    weeklyKpiTargets: {
                        challenges: 4,
                    },
                } as never)
                const challenges = result.items.find((item) => item.key === "challenges")
                expect(challenges).toEqual(expect.objectContaining({
                    current: 1,
                    target: 4,
                    canClaim: false,
                    claimed: false,
                }))
            })

        it("propagates projection failures before reading reward floors",
            async () => {
                const failure = new Error("stats unavailable")
                const getStats = jest.fn().mockRejectedValue(failure)
                const getFloorStates = jest.fn()
                const resolver = new MyKpisResolver({
                    getStats
                } as never,
                    {
                        getFloorStates
                    } as never)

                await expect(resolver.execute({
                    id: "u1"
                } as never)).rejects.toBe(failure)
                expect(getFloorStates).not.toHaveBeenCalled()
            })
    })
