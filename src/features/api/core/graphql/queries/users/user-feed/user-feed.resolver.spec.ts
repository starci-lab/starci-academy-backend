import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    UserFeedResolver,
} from "./user-feed.resolver"

const row = (
    overrides: Record<string, unknown> = {
    },
) => ({
    id: "activity-1",
    actorUserId: "profile-1",
    actorUsername: "owner",
    actorAvatar: "avatar",
    type: ActivityType.CourseEnrolled,
    metadata: {
        target: {
            entityName: "CourseEntity",
            id: "course-1",
            label: "Course fallback",
        },
    },
    at: new Date("2026-01-01T00:00:00.000Z"),
    reactionCount: "4",
    myReaction: null,
    ...overrides,
})

describe("UserFeedResolver",
    () => {
        it("supports anonymous viewers, maps target labels, and emits a next cursor",
            async () => {
                const rows = [row(),
                    row({
                        id: "activity-2", metadata: null 
                    })]
                const entityManager = {
                    query: jest.fn().mockResolvedValue(rows),
                }
                const labelResolverService = {
                    resolveLabels: jest.fn().mockResolvedValue(new Map([
                        [toGlobalId("CourseEntity",
                            "course-1"),
                        "Resolved course"],
                    ])),
                }
                const resolver = new UserFeedResolver(entityManager as never,
            labelResolverService as never)

                const result = await resolver.execute({
                    userId: "profile-1",
                    limit: 1,
                } as never,
                undefined,
                Locale.En)

                expect(entityManager.query).toHaveBeenCalledWith(
                    expect.stringContaining("WHERE a.user_id = $1"),
                    ["profile-1",
                        null],
                )
                expect(entityManager.query.mock.calls[0][0]).toContain("LIMIT 2")
                expect(labelResolverService.resolveLabels).toHaveBeenCalledWith({
                    refs: [{
                        entityName: "CourseEntity", id: "course-1" 
                    }],
                    locale: Locale.En,
                })
                expect(result.items).toEqual([expect.objectContaining({
                    actorGlobalId: toGlobalId(UserEntity.name,
                        "profile-1"),
                    targetLabel: "Resolved course",
                    reactionCount: 4,
                    isMine: false,
                })])
                expect(result.nextCursor).toEqual(expect.any(String))
            })

        it("decodes valid cursors, clamps limits, and falls back to target labels",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([row({
                        actorUserId: "viewer-1",
                        metadata: {
                            target: {
                                entityName: "CourseEntity",
                                id: "course-1",
                                label: "Fallback",
                            },
                        },
                        myReaction: "like",
                    })]),
                }
                const labelResolverService = {
                    resolveLabels: jest.fn().mockResolvedValue(new Map()),
                }
                const resolver = new UserFeedResolver(entityManager as never,
            labelResolverService as never)
                const encode = (resolver as unknown as {
            encodeCursor: (offset: number) => string
        }).encodeCursor.bind(resolver)

                const result = await resolver.execute({
                    userId: "profile-1",
                    limit: 999,
                    cursor: encode(12),
                } as never,
        {
            id: "viewer-1" 
        } as UserEntity,
        Locale.Vi)

                expect(entityManager.query.mock.calls[0][0]).toContain("OFFSET 12")
                expect(entityManager.query.mock.calls[0][0]).toContain("LIMIT 51")
                expect(result.items[0]).toEqual(expect.objectContaining({
                    targetLabel: "Fallback",
                    myReaction: "like",
                    isMine: true,
                }))
                expect(result.nextCursor).toBeNull()
            })

        it("treats malformed cursors as page one and supports rows without targets",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([row({
                        metadata: null 
                    })]),
                }
                const labelResolverService = {
                    resolveLabels: jest.fn().mockResolvedValue(new Map()),
                }
                const resolver = new UserFeedResolver(entityManager as never,
            labelResolverService as never)

                const result = await resolver.execute({
                    userId: "profile-1",
                    cursor: "broken",
                } as never,
                undefined,
                Locale.En)

                expect(entityManager.query.mock.calls[0][0]).toContain("OFFSET 0")
                expect(result.items[0]).toEqual(expect.objectContaining({
                    targetGlobalId: null,
                    targetLabel: null,
                }))
            })
    })
