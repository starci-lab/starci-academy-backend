import {
    MyUpcomingLivestreamsResolver
} from "./my-upcoming-livestreams.resolver"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

describe("MyUpcomingLivestreamsResolver",
    () => {
        it("skips orphan enrollments and queries only the viewer's enrollments",
            async () => {
                const entityManager = {
                    find: jest.fn().mockResolvedValue([{
                        course: null
                    },
                    {
                        course: {
                            id: "c1", livestreamSessions: []
                        }
                    }])
                }
                const resolver = new MyUpcomingLivestreamsResolver(entityManager as never,
{
    transform: jest.fn()
} as never)
                await expect(resolver.execute({
                    id: "u1"
                } as never,
"en" as never,
99)).resolves.toEqual([])
                expect(entityManager.find).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        where: {
                            user: {
                                id: "u1"
                            }
                        }
                    }))
            })

        it("localizes a scheduled session, computes its end, and respects the limit clamp",
            async () => {
                const transform = jest.fn((session: { note?: string }) => {
                    session.note = "Localized live class"
                })
                const entityManager = {
                    find: jest.fn().mockResolvedValue([{
                        course: {
                            id: "course-1",
                            title: "Algorithms",
                            displayId: "algorithms",
                            defaultLocale: null,
                            livestreamSessions: [{
                                dayOfWeek: 1,
                                startTime: "10:00",
                                expectedEndTime: "11:00",
                                isOverridable: false,
                                note: null,
                            }],
                        },
                    }]),
                }
                const resolver = new MyUpcomingLivestreamsResolver(
                    entityManager as never,
                    {
                        transform,
                    } as never,
                )

                const result = await resolver.execute({
                    id: "u1",
                } as never,
                "en" as never,
                0)

                expect(result).toHaveLength(1)
                expect(result[0].sessionTitle).toBe("Localized live class")
                expect(result[0].nextEndAt).not.toBeNull()
                expect(transform).toHaveBeenCalledWith(
                    expect.objectContaining({
                        isOverridable: false,
                    }),
                    "en",
                    Locale.En,
                )
            })
    })
