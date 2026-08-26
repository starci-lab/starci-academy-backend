import {
    ContributionProjectionService
} from "./contribution-projection.service"

describe("ContributionProjectionService",
    () => {
        it("maps contribution totals and preserves past-year rows",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        updatedAt: new Date(0), value: {
                            days: [{
                                date: "2026-01-01", contents: "2", challenges: 1, milestones: 0
                            }]
                        }
                    }), query: jest.fn()
                }
                await expect(new ContributionProjectionService(manager as never).getCalendar("u",
                    2020)).resolves.toEqual([{
                    date: "2026-01-01", contents: 2, challenges: 1, milestones: 0, total: 3
                }])
                expect(manager.query).not.toHaveBeenCalled()
            })
        it("recomputes a missing calendar row",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null), query: jest.fn()
                }
                await expect(new ContributionProjectionService(manager as never).getCalendar("u",
                    2020)).resolves.toEqual([])
                expect(manager.query).toHaveBeenCalledWith(expect.stringContaining("user_contribution_projections"),
                    ["u",
                        2020])
            })
    })
