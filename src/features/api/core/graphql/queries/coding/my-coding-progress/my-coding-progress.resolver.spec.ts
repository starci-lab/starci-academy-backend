import {
    CodingDomain
} from "@modules/databases/postgresql/primary/enums/coding-domain"
import {
    MyCodingProgressResolver
} from "./my-coding-progress.resolver"

describe("MyCodingProgressResolver",
    () => {
        it("combines cached progress with projection domain buckets",
            async () => {
                const getProgress = jest.fn().mockResolvedValue({
                    solvedProblemIds: ["problem-1"],
                    attemptedProblemIds: ["problem-1",
                        "problem-2"],
                    revealedProblemIds: ["problem-3"],
                    totalPoints: 120,
                })
                const getSkills = jest.fn().mockResolvedValue({
                    byDomain: [
                        {
                            key: CodingDomain.Arrays,
                            solved: 2,
                        },
                        {
                            key: CodingDomain.Graph,
                            solved: 1,
                        },
                    ],
                })
                const resolver = new MyCodingProgressResolver({
                    getProgress
                } as never,
{
    getSkills
} as never)

                await expect(resolver.execute({
                    id: "user-1"
                } as never)).resolves.toEqual({
                    solvedProblemIds: ["problem-1"],
                    attemptedProblemIds: ["problem-1",
                        "problem-2"],
                    revealedProblemIds: ["problem-3"],
                    totalPoints: 120,
                    byDomain: [
                        {
                            domain: CodingDomain.Arrays,
                            solved: 2,
                        },
                        {
                            domain: CodingDomain.Graph,
                            solved: 1,
                        },
                    ],
                })
                expect(getProgress).toHaveBeenCalledWith({
                    userId: "user-1"
                })
                expect(getSkills).toHaveBeenCalledWith("user-1")
            })

        it("preserves an empty domain rollup and rejects either source failure",
            async () => {
                const getProgress = jest.fn().mockResolvedValue({
                    solvedProblemIds: [],
                    attemptedProblemIds: [],
                    revealedProblemIds: [],
                    totalPoints: 0,
                })
                const getSkills = jest.fn().mockResolvedValue({
                    byDomain: []
                })
                const resolver = new MyCodingProgressResolver({
                    getProgress
                } as never,
{
    getSkills
} as never)
                await expect(resolver.execute({
                    id: "user-empty"
                } as never)).resolves.toEqual({
                    solvedProblemIds: [],
                    attemptedProblemIds: [],
                    revealedProblemIds: [],
                    totalPoints: 0,
                    byDomain: [],
                })

                const failure = new Error("progress unavailable")
                getProgress.mockRejectedValueOnce(failure)
                await expect(resolver.execute({
                    id: "user-1"
                } as never)).rejects.toBe(failure)
                const skillsFailure = new Error("projection unavailable")
                getSkills.mockRejectedValueOnce(skillsFailure)
                await expect(resolver.execute({
                    id: "user-1"
                } as never)).rejects.toBe(skillsFailure)
            })
    })
