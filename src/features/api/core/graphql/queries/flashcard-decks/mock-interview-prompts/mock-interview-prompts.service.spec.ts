import {
    ChallengeDifficulty
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MOCK_INTERVIEW_CLASSIC_PROMPTS
} from "./constants/classic-prompts"
import {
    MockInterviewPromptsService
} from "./mock-interview-prompts.service"

describe("MockInterviewPromptsService",
    () => {
        it("puts course tasks before localized classic prompts and defaults difficulty",
            async () => {
                const find = jest.fn().mockResolvedValue([
                    {
                        id: "task-1",
                        title: "Design a queue",
                        difficulty: null,
                    },
                    {
                        id: "task-2",
                        title: "Design a cache",
                        difficulty: ChallengeDifficulty.Hard,
                    },
                ])
                const service = new MockInterviewPromptsService({
                    find
                } as never)

                const result = await service.list({
                    courseId: "course-1",
                    locale: Locale.Vi,
                })

                expect(result.prompts.slice(0,
                    2)).toEqual([
                    {
                        id: "task-1",
                        title: "Design a queue",
                        difficulty: ChallengeDifficulty.Medium,
                        source: "capstone",
                    },
                    {
                        id: "task-2",
                        title: "Design a cache",
                        difficulty: ChallengeDifficulty.Hard,
                        source: "capstone",
                    },
                ])
                expect(result.prompts.slice(2)).toEqual(MOCK_INTERVIEW_CLASSIC_PROMPTS.map((prompt) => ({
                    id: prompt.id,
                    title: prompt.title[Locale.Vi],
                    difficulty: prompt.difficulty,
                    source: "classic",
                })))
                expect(find).toHaveBeenCalledWith(expect.anything(),
                    {
                        where: {
                            milestone: {
                                course: {
                                    id: "course-1",
                                },
                            },
                        },
                        order: {
                            sortIndex: "ASC",
                        },
                    })
            })

        it("still returns classics when a course has no tasks and propagates query failures",
            async () => {
                const find = jest.fn().mockResolvedValue([])
                const service = new MockInterviewPromptsService({
                    find
                } as never)
                const result = await service.list({
                    courseId: "empty-course",
                    locale: Locale.En,
                })
                expect(result.prompts).toHaveLength(MOCK_INTERVIEW_CLASSIC_PROMPTS.length)
                expect(result.prompts[0]).toEqual({
                    id: MOCK_INTERVIEW_CLASSIC_PROMPTS[0].id,
                    title: MOCK_INTERVIEW_CLASSIC_PROMPTS[0].title[Locale.En],
                    difficulty: MOCK_INTERVIEW_CLASSIC_PROMPTS[0].difficulty,
                    source: "classic",
                })

                const failure = new Error("database unavailable")
                find.mockRejectedValueOnce(failure)
                await expect(service.list({
                    courseId: "course-1",
                    locale: Locale.En,
                })).rejects.toBe(failure)
            })
    })
