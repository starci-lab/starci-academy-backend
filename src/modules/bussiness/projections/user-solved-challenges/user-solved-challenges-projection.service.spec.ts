import {
    UserSolvedChallengesProjectionService
} from "./user-solved-challenges-projection.service"

describe("UserSolvedChallengesProjectionService",
    () => {
        it("maps challenge rows and preserves nullable fields",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        updatedAt: new Date(), value: {
                            challenges: [{
                                title: "Challenge", submissionUrl: null, submissionType: null, passedAt: "2026-01-01T00:00:00.000Z"
                            }]
                        }
                    }), query: jest.fn()
                }
                await expect(new UserSolvedChallengesProjectionService(manager as never).getChallenges("u")).resolves.toEqual([expect.objectContaining({
                    id: null, title: "Challenge", passedAt: new Date("2026-01-01T00:00:00.000Z")
                })])
            })
        it("returns an unranked strength result while retaining XP",
            async () => {
                const manager = {
                    query: jest.fn().mockResolvedValue([{
                        mine: 0, xp: 25
                    }])
                }
                const result = await new UserSolvedChallengesProjectionService(manager as never).getChallengeStrength("u")
                expect(result).toEqual(expect.objectContaining({
                    rank: null, percentile: null, xp: 25
                }))
            })

        it("recomputes stale rows and returns an empty challenge list when refreshed empty",
            async () => {
                const manager = {
                    findOne: jest.fn()
                        .mockResolvedValueOnce({
                            updatedAt: new Date("2020-01-01"), value: {
                                challenges: [],
                            },
                        })
                        .mockResolvedValueOnce({
                            updatedAt: new Date(), value: {
                            },
                        }),
                    query: jest.fn(),
                }
                const service = new UserSolvedChallengesProjectionService(manager as never)
                await expect(service.getChallenges("u")).resolves.toEqual([])
                expect(manager.query).toHaveBeenCalledWith(
                    expect.stringContaining("user_solved_challenges_projections"),
                    ["u"],
                )
            })

        it("calculates rank and percentile for a ranked learner",
            async () => {
                const manager = {
                    query: jest.fn().mockResolvedValue([{
                        mine: 50, xp: "40", pool_size: 4, beaten: 2, rank: 2,
                    }]),
                }
                await expect(new UserSolvedChallengesProjectionService(manager as never).getChallengeStrength("u"))
                    .resolves.toEqual({
                        rank: 2, percentile: 50, xp: 40,
                    })
            })

        it("uses a transaction manager for recomputation",
            async () => {
                const service = new UserSolvedChallengesProjectionService({
                    query: jest.fn(),
                } as never)
                const transactionManager = {
                    query: jest.fn(),
                }
                await service.recompute({
                    userId: "u", entityManager: transactionManager as never,
                })
                expect(transactionManager.query).toHaveBeenCalledWith(
                    expect.stringContaining("strengthScore"),
                    ["u"],
                )
            })

        it("returns zero percentile and no rank when a positive score has no numeric rank pool",
            async () => {
                const manager = {
                    query: jest.fn().mockResolvedValue([{
                        mine: "10",
                        xp: "0",
                        pool_size: 0,
                        beaten: 0,
                        rank: undefined,
                    }]),
                }

                await expect(new UserSolvedChallengesProjectionService(manager as never)
                    .getChallengeStrength("u")).resolves.toEqual({
                    percentile: 0,
                    rank: null,
                    xp: 0,
                })
            })
    })
