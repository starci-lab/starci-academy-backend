import {
    UserCodingProjectionService
} from "./user-coding-projection.service"

describe("UserCodingProjectionService",
    () => {
        it("recomputes a missing row and maps skills/history defaults",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValue({
                        updatedAt: new Date(),
                        value: {
                            byLanguage: [{
                                key: "ts", solved: 2
                            }], history: [{
                                problemTitle: "P", slug: "p", difficulty: "easy", domain: "web", languages: ["ts"], firstSolvedAt: "2026-01-01T00:00:00.000Z"
                            }]
                        }
                    }), query: jest.fn()
                }
                const service = new UserCodingProjectionService(manager as never)
                await expect(service.getSkills("u")).resolves.toEqual({
                    byLanguage: [{
                        key: "ts", solved: 2
                    }], byDifficulty: [], byDomain: []
                })
                await expect(service.getHistory("u")).resolves.toEqual([expect.objectContaining({
                    problemTitle: "P", firstSolvedAt: new Date("2026-01-01T00:00:00.000Z")
                })])
                expect(manager.query).toHaveBeenCalledTimes(1)
            })
        it("returns an unranked result for zero solves",
            async () => {
                const manager = {
                    query: jest.fn().mockResolvedValue([{
                        mine: 0
                    }])
                }
                await expect(new UserCodingProjectionService(manager as never).getRank({
                    userId: "u"
                })).resolves.toEqual({
                    rank: null, percentile: null
                })
            })
    })
