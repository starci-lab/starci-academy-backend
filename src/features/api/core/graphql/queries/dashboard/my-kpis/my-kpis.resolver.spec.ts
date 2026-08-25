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
    })
