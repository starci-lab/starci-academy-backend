import {
    TalentCandidatesResolver,
} from "./talent-candidates.resolver"

describe("TalentCandidatesResolver",
    () => {
        it("clamps the requested page and delegates the selected track",
            async () => {
                const rankByTrack = jest.fn().mockResolvedValue([{
                    user: {
                        id: "user-1",
                    },
                }])

                await expect(new TalentCandidatesResolver({
                    rankByTrack,
                } as never).execute("course-1",
                    500,
                    -4)).resolves.toHaveLength(1)
                expect(rankByTrack).toHaveBeenCalledWith({
                    courseId: "course-1",
                    limit: 48,
                    offset: 0,
                })
            })

        it("uses defaults when pagination arguments are omitted",
            async () => {
                const rankByTrack = jest.fn().mockResolvedValue([])
                await new TalentCandidatesResolver({
                    rankByTrack,
                } as never).execute("course-2",
                    undefined as never,
                    undefined as never)

                expect(rankByTrack).toHaveBeenCalledWith({
                    courseId: "course-2",
                    limit: 24,
                    offset: 0,
                })
            })
        it("preserves ranking-service failures for callers",
            async () => {
                const failure = new Error("ranking unavailable")
                const rankByTrack = jest.fn().mockRejectedValue(failure)

                await expect(new TalentCandidatesResolver({
                    rankByTrack,
                } as never).execute("course-1",
                    10,
                    2)).rejects.toBe(failure)
                expect(rankByTrack).toHaveBeenCalledWith({
                    courseId: "course-1",
                    limit: 10,
                    offset: 2,
                })
            })
    })
