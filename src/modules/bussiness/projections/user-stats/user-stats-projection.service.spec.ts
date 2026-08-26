import {
    UserStatsProjectionService
} from "./user-stats-projection.service"

describe("UserStatsProjectionService",
    () => {
        it("maps projection counters and streak days",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        updatedAt: new Date(), value: {
                            followerCount: "2", weeklyXp: "9", last7Days: [{
                                date: "2026-01-01", active: 1
                            }]
                        }
                    }), query: jest.fn()
                }
                await expect(new UserStatsProjectionService(manager as never).getStats("u")).resolves.toEqual(expect.objectContaining({
                    followerCount: 2, weeklyXp: 9, last7Days: [{
                        date: "2026-01-01", active: true
                    }]
                }))
            })
        it("recomputes missing rows and returns zero defaults",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null), query: jest.fn()
                }
                await expect(new UserStatsProjectionService(manager as never).getStats("u")).resolves.toEqual(expect.objectContaining({
                    followerCount: 0, weeklyChallenges: 0, last7Days: []
                }))
                expect(manager.query).toHaveBeenCalled()
            })
    })
