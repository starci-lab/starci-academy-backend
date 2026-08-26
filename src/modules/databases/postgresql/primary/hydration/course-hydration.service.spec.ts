import {
    CourseHydrationService
} from "./course-hydration.service"

describe("CourseHydrationService",
    () => {
        it("throws a typed not-found error for an unknown course",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null), find: jest.fn()
                }; const service = new CourseHydrationService(manager as never,
{
} as never)
                await expect(service.loadById("missing")).rejects.toThrow(); expect(manager.find).not.toHaveBeenCalled()
            })

        it("hydrates ordered relations and nested module content into plain entities",
            async () => {
                const plain = <T extends object>(value: T) => ({
                    ...value,
                    toPlain: jest.fn(() => ({
                        ...value
                    })),
                })
                const challenge = plain({
                    id: "challenge-1"
                })
                const content = {
                    ...plain({
                        id: "content-1"
                    }),
                    challenges: [challenge],
                }
                const module = plain({
                    id: "module-1"
                })
                const course = plain({
                    id: "course-1", displayId: "course-one"
                })
                const manager = {
                    findOne: jest.fn().mockResolvedValue(course),
                    find: jest.fn()
                        .mockResolvedValueOnce([plain({
                            id: "prerequisite-1"
                        })])
                        .mockResolvedValueOnce([plain({
                            id: "value-1"
                        })])
                        .mockResolvedValueOnce([plain({
                            id: "qna-1"
                        })])
                        .mockResolvedValueOnce([plain({
                            id: "pricing-1"
                        })])
                        .mockResolvedValueOnce([plain({
                            id: "livestream-1"
                        })])
                        .mockResolvedValueOnce([module])
                        .mockResolvedValueOnce([content])
                        .mockResolvedValueOnce([plain({
                            id: "preview-1"
                        })]),
                }
                const service = new CourseHydrationService(
                    manager as never,
                    {
                        allMustDone: jest.fn(async (tasks: Array<Promise<unknown>>) => Promise.all(tasks)),
                    } as never,
                )

                const result = await service.loadById("course-1")

                expect(result.id).toBe("course-1")
                expect(result.prerequisites).toHaveLength(1)
                expect(result.valuePropositions).toHaveLength(1)
                expect(result.qnas).toHaveLength(1)
                expect(result.pricingPhases).toHaveLength(1)
                expect(result.livestreamSessions).toHaveLength(1)
                expect(result.modules?.[0]?.contents?.[0]?.challenges).toHaveLength(1)
                expect(result.modules?.[0]?.previewContents).toHaveLength(1)
                expect(manager.find).toHaveBeenCalledTimes(8)
            })
    })
