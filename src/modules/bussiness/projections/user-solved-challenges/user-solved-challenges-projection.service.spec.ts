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
    })
