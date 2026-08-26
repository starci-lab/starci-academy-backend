import type {
    EntityManager,
} from "typeorm"
import {
    CourseStatsProjectionService,
} from "./course-stats-projection.service"

describe("CourseStatsProjectionService",
    () => {
        it("only inserts a projection by selecting an existing course",
            async () => {
                const query = jest.fn().mockResolvedValue(undefined)
                const service = new CourseStatsProjectionService({
                    query,
                } as unknown as EntityManager)

                await service.recompute({
                    courseId: "1ab239c8-ebb5-53ee-b255-dc7839a6b959",
                })

                const [
                    sql,
                    params,
                ] = query.mock.calls[0] as [string, Array<string>]
                expect(sql).toContain("FROM courses")
                expect(sql).toContain("WHERE courses.id = $1::uuid")
                expect(params).toEqual([
                    "1ab239c8-ebb5-53ee-b255-dc7839a6b959",
                ])
            })

        it("parses fresh counters and refreshes stale rows to zero defaults",
            async () => {
                const manager = {
                    findOne: jest.fn()
                        .mockResolvedValueOnce({
                            updatedAt: new Date(), value: {
                                enrollmentCount: "12",
                            },
                        })
                        .mockResolvedValueOnce({
                            updatedAt: new Date("2020-01-01"), value: {
                            },
                        })
                        .mockResolvedValueOnce({
                            updatedAt: new Date(), value: {
                                enrollmentCount: "not-a-number",
                            },
                        }),
                    query: jest.fn(),
                }
                const service = new CourseStatsProjectionService(manager as never)

                await expect(service.getStats("course-1")).resolves.toEqual({
                    enrollmentCount: 12,
                })
                await expect(service.getStats("course-2")).resolves.toEqual({
                    enrollmentCount: 0,
                })
                expect(manager.query).toHaveBeenCalledWith(
                    expect.stringContaining("course_stats_projections"),
                    ["course-2"],
                )
            })

        it("honors a transaction manager override during recompute",
            async () => {
                const service = new CourseStatsProjectionService({
                    query: jest.fn(),
                } as never)
                const transactionManager = {
                    query: jest.fn(),
                }
                await service.recompute({
                    courseId: "course-2", entityManager: transactionManager as never,
                })
                expect(transactionManager.query).toHaveBeenCalledWith(
                    expect.stringContaining("enrollmentCount"),
                    ["course-2"],
                )
            })
    })
