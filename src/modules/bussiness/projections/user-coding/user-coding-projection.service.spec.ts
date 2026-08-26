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

        it("normalizes malformed history and leaderboard rows",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        updatedAt: new Date(), value: {
                            byLanguage: undefined, byDifficulty: undefined, byDomain: undefined,
                            history: [{
                                problemTitle: "P", slug: "p", difficulty: "easy", domain: "web",
                                languages: "ts", firstSolvedAt: null,
                            }],
                        },
                    }),
                    query: jest.fn().mockResolvedValue([{
                        user_id: "u", username: null, solved_count: "bad"
                    }]),
                }
                const service = new UserCodingProjectionService(manager as never)

                await expect(service.getHistory("u")).resolves.toEqual([{
                    problemTitle: "P", slug: "p", difficulty: "easy", domain: "web",
                    languages: [], firstSolvedAt: null,
                }])
                await expect(service.getLeaderboard({
                })).resolves.toEqual([{
                    userId: "u", username: "", solvedCount: 0,
                }])
                expect(manager.query).toHaveBeenCalledWith(
                    expect.stringContaining("LIMIT $1"),
                    [50],
                )
            })

        it("reports a zero percentile when a solved user has no ranking pool",
            async () => {
                const manager = {
                    query: jest.fn().mockResolvedValue([{
                        mine: 2, pool_size: 0, beaten: 0, rank: "not-a-number",
                    }]),
                }
                await expect(new UserCodingProjectionService(manager as never).getRank({
                    userId: "u",
                })).resolves.toEqual({
                    rank: null, percentile: 0,
                })
            })

        it("recomputes a stale row and honors a transaction manager override",
            async () => {
                const manager = {
                    findOne: jest.fn()
                        .mockResolvedValueOnce({
                            updatedAt: new Date("2020-01-01"), value: {
                            },
                        })
                        .mockResolvedValueOnce({
                            updatedAt: new Date(), value: {
                            },
                        }),
                    query: jest.fn(),
                }
                const service = new UserCodingProjectionService(manager as never)
                await expect(service.getSkills("u")).resolves.toEqual({
                    byLanguage: [], byDifficulty: [], byDomain: [],
                })
                expect(manager.query).toHaveBeenCalledTimes(1)

                const transactionManager = {
                    query: jest.fn(),
                }
                await service.recompute({
                    userId: "u", entityManager: transactionManager as never,
                })
                expect(transactionManager.query).toHaveBeenCalledWith(
                    expect.stringContaining("user_coding_projections"),
                    ["u"],
                )
            })
    })
