import {
    CourseLearningHistoryFailedException,
} from "@modules/platform/exceptions/errors/courses/course-learning-history-failed"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    CourseLearningHistoryResolver,
} from "./course-learning-history.resolver"

const historyRow = (
    id: string,
) => ({
    id,
    type: "lessonRead",
    label: "Intro",
    at: new Date("2026-01-01T00:00:00.000Z"),
    moduleTitle: "Basics",
    difficulty: "beginner",
})

describe("CourseLearningHistoryResolver",
    () => {
        it("decodes the course id, maps rows, and emits a pagination cursor",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([
                        historyRow("event-1"),
                        historyRow("event-2"),
                    ]),
                }
                const winstonService = {
                    log: jest.fn()
                }
                const resolver = new CourseLearningHistoryResolver(entityManager as never,
            winstonService as never)

                const result = await resolver.execute({
                    courseId: toGlobalId("CourseEntity",
                        "course-1"),
                    limit: 1,
                } as never,
        {
            id: "user-1"
        } as never)

                expect(entityManager.query).toHaveBeenCalledWith(
                    expect.stringContaining("UNION ALL"),
                    ["user-1",
                        "course-1"],
                )
                expect(entityManager.query.mock.calls[0][0]).toContain("LIMIT 2")
                expect(result.items).toEqual([historyRow("event-1")])
                expect(result.nextCursor).toEqual(expect.any(String))
            })

        it("fails closed and logs malformed course ids",
            async () => {
                const entityManager = {
                    query: jest.fn()
                }
                const winstonService = {
                    log: jest.fn()
                }
                const resolver = new CourseLearningHistoryResolver(entityManager as never,
            winstonService as never)

                await expect(resolver.execute({
                    courseId: "bad-id"
                } as never,
            {
                id: "user-1"
            } as never)).rejects.toThrow(CourseLearningHistoryFailedException)
                expect(winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        op: "course-learning-history.malformed-course-id",
                        userId: "user-1",
                    }),
                )
                expect(entityManager.query).not.toHaveBeenCalled()
            })

        it("wraps database errors and accepts a valid cursor on a final page",
            async () => {
                const entityManager = {
                    query: jest.fn().mockRejectedValue(new Error("database offline")),
                }
                const winstonService = {
                    log: jest.fn()
                }
                const resolver = new CourseLearningHistoryResolver(entityManager as never,
            winstonService as never)
                const encode = (resolver as unknown as {
            encodeCursor: (offset: number) => string
        }).encodeCursor.bind(resolver)

                await expect(resolver.execute({
                    courseId: toGlobalId("CourseEntity",
                        "course-1"),
                    cursor: encode(3),
                    limit: 50,
                } as never,
        {
            id: "user-1"
        } as never)).rejects.toThrow(CourseLearningHistoryFailedException)
                expect(entityManager.query.mock.calls[0][0]).toContain("OFFSET 3")
                expect(winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        op: "course-learning-history.query",
                        meta: {
                            courseId: "course-1"
                        },
                    }),
                )
            })

        it("clamps invalid limits and treats malformed cursors as the first page",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([]),
                }
                const winstonService = {
                    log: jest.fn(),
                }
                const resolver = new CourseLearningHistoryResolver(entityManager as never,
                    winstonService as never)

                await expect(resolver.execute({
                    courseId: toGlobalId(
                        "CourseEntity",
                        "course-1",
                    ),
                    limit: 0,
                    cursor: "not-base64-json",
                } as never,
                {
                    id: "user-1",
                } as never)).resolves.toEqual({
                    items: [],
                    nextCursor: null,
                })
                expect(entityManager.query.mock.calls[0][0]).toContain("OFFSET 0")
                expect(entityManager.query.mock.calls[0][0]).toContain("LIMIT 2")
            })

        it("returns a terminal page when exactly one row is returned",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([historyRow("event-final")]),
                }
                const resolver = new CourseLearningHistoryResolver(
                    entityManager as never,
                    {
                        log: jest.fn(),
                    } as never,
                )

                await expect(resolver.execute({
                    courseId: toGlobalId("CourseEntity",
                        "course-1"),
                    limit: 2,
                } as never,
                {
                    id: "user-1",
                } as never)).resolves.toEqual({
                    items: [historyRow("event-final")],
                    nextCursor: null,
                })
            })
    })
