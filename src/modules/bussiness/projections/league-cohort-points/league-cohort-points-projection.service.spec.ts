import {
    LeagueCohortPointsProjectionService
} from "./league-cohort-points-projection.service"

describe("LeagueCohortPointsProjectionService",
    () => {
        const manager = {
            findOne: jest.fn(), query: jest.fn().mockResolvedValue(undefined)
        }
        const service = new LeagueCohortPointsProjectionService(manager as never)
        beforeEach(() => jest.clearAllMocks())
        it("maps stored members with ranks and numeric points",
            async () => {
                manager.findOne.mockResolvedValue({
                    updatedAt: new Date(), value: {
                        members: [{
                            userId: "u", username: "A", avatar: null, weekPoints: "7"
                        }]
                    }
                })
                await expect(service.getMembers("cohort-1")).resolves.toEqual([{
                    userId: "u", username: "A", avatar: null, weekPoints: 7, rank: 1, rankDelta: null
                }])
            })
        it("recomputes a missing cohort and returns an empty board",
            async () => {
                manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
                await expect(service.getMembers("cohort-1")).resolves.toEqual([])
                expect(manager.query).toHaveBeenCalledWith(expect.stringContaining("ON CONFLICT"),
                    ["cohort-1"])
            })

        it("refreshes a stale cohort and normalizes missing point values",
            async () => {
                manager.findOne
                    .mockResolvedValueOnce({
                        updatedAt: new Date("2020-01-01"),
                        value: {
                            members: [{
                                userId: "u1",
                                username: "A",
                                avatar: null,
                                weekPoints: null,
                            }],
                        },
                    })
                    .mockResolvedValueOnce({
                        updatedAt: new Date(),
                        value: {
                            members: [{
                                userId: "u1",
                                username: "A",
                                avatar: null,
                                weekPoints: null,
                            }],
                        },
                    })

                await expect(service.getMembers("cohort-2")).resolves.toEqual([{
                    userId: "u1",
                    username: "A",
                    avatar: null,
                    weekPoints: 0,
                    rank: 1,
                    rankDelta: null,
                }])
                expect(manager.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO"),
                    ["cohort-2"])
            })
    })
