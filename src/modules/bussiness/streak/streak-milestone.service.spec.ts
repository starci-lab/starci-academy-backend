jest.mock("@features/api/processors/ai/shared/xp/write-coin-history",
    () => ({
        writeCoinHistory: jest.fn(),
    }))

import {
    StreakMilestoneService,
} from "./streak-milestone.service"
import {
    writeCoinHistory
} from "@features/api/processors/ai/shared/xp/write-coin-history"

describe("StreakMilestoneService",
    () => {
        it("does not grant milestones below the first threshold or inactive daily bonus",
            async () => {
                const stats = {
                    getStats: jest.fn().mockResolvedValue({
                        streak: 0, last7Days: [{
                            date: "today", active: false
                        }]
                    })
                }
                const manager = {
                    findOne: jest.fn(), transaction: jest.fn()
                }
                const service = new StreakMilestoneService(manager as never,
stats as never,
{
} as never)

                await service.checkAndGrant("user-1")
                await service.checkAndGrantDailyBonus("user-1")

                expect(manager.findOne).not.toHaveBeenCalled()
                expect(manager.transaction).not.toHaveBeenCalled()
            })

        it("skips already-granted milestones and daily bonus",
            async () => {
                const stats = {
                    getStats: jest.fn()
                        .mockResolvedValueOnce({
                            streak: 30, last7Days: []
                        })
                        .mockResolvedValueOnce({
                            streak: 30, last7Days: [{
                                date: "today", active: true
                            }]
                        })
                }
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        id: "history"
                    }), transaction: jest.fn()
                }
                const service = new StreakMilestoneService(manager as never,
stats as never,
{
} as never)

                await service.checkAndGrant("user-1")
                await service.checkAndGrantDailyBonus("user-1")

                expect(manager.findOne).toHaveBeenCalledTimes(3)
                expect(manager.transaction).not.toHaveBeenCalled()
            })

        it("grants a newly reached milestone and active daily bonus",
            async () => {
                const stats = {
                    getStats: jest.fn()
                        .mockResolvedValueOnce({
                            streak: 7, last7Days: []
                        })
                        .mockResolvedValueOnce({
                            streak: 7, last7Days: [{
                                date: "2026-08-26", active: true
                            }]
                        })
                }
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null),
                    transaction: jest.fn(async (work: (transactionManager: unknown) => Promise<void>) => work(manager))
                }
                const notification = {
                    createNotification: jest.fn().mockResolvedValue(undefined)
                }
                const service = new StreakMilestoneService(manager as never,
stats as never,
notification as never)

                await service.checkAndGrant("user-1")
                await service.checkAndGrantDailyBonus("user-1")

                expect(manager.transaction).toHaveBeenCalledTimes(1)
                expect(notification.createNotification).toHaveBeenCalledWith(expect.objectContaining({
                    userId: "user-1"
                }))
                expect(writeCoinHistory).toHaveBeenCalledTimes(2)
            })
    })
