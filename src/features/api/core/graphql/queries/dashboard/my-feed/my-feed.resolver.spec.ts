import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import {
    MyFeedCategory,
    MyFeedTab,
} from "./graphql-types/request"
import {
    MyFeedResolver,
} from "./my-feed.resolver"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"

const row = (
    overrides: Record<string, unknown> = {
    },
) => ({
    id: "activity-1",
    actorUserId: "actor-1",
    actorUsername: "alice",
    actorAvatar: null,
    type: ActivityType.LessonRead,
    metadata: {
        target: {
            entityName: "ContentEntity",
            id: "content-1",
            label: "Fallback content",
        },
    },
    at: new Date("2026-01-01T00:00:00.000Z"),
    reactionCount: "3",
    myReaction: null,
    ...overrides,
})

describe("MyFeedResolver",
    () => {
        it("builds a following/category query, maps targets, and emits a stable next cursor",
            async () => {
                const rows = [
                    row(),
                    row({
                        id: "activity-2",
                        actorUserId: "user-1",
                        actorUsername: "me",
                        metadata: null,
                        reactionCount: 2,
                        myReaction: "like",
                    }),
                ]
                const entityManager = {
                    query: jest.fn().mockResolvedValue(rows),
                }
                const labelResolverService = {
                    resolveLabels: jest.fn().mockResolvedValue(new Map([
                        [toGlobalId("ContentEntity",
                            "content-1"),
                        "Resolved content"],
                    ])),
                }
                const resolver = new MyFeedResolver(entityManager as never,
            labelResolverService as never)

                const result = await resolver.execute({
                    tab: MyFeedTab.Following,
                    category: MyFeedCategory.Courses,
                    limit: 1,
                } as never,
        {
            id: "user-1" 
        } as UserEntity,
        Locale.En)

                expect(entityManager.query).toHaveBeenCalledWith(
                    expect.stringContaining("JOIN user_follows f ON f.following_id = a.user_id"),
                    [
                        "user-1",
                        expect.any(String),
                        expect.arrayContaining([ActivityType.CourseEnrolled]),
                    ],
                )
                expect(entityManager.query.mock.calls[0][0]).toContain("LIMIT 2")
                expect(labelResolverService.resolveLabels).toHaveBeenCalledWith({
                    refs: [{
                        entityName: "ContentEntity",
                        id: "content-1",
                    }],
                    locale: Locale.En,
                })
                expect(result.items).toEqual([{
                    id: "activity-1",
                    actorGlobalId: toGlobalId(UserEntity.name,
                        "actor-1"),
                    actorUsername: "alice",
                    actorAvatar: null,
                    type: ActivityType.LessonRead,
                    targetGlobalId: toGlobalId("ContentEntity",
                        "content-1"),
                    targetLabel: "Resolved content",
                    at: rows[0].at,
                    reactionCount: 3,
                    myReaction: null,
                    isMine: false,
                }])
                expect(result.nextCursor).toEqual(expect.any(String))
            })

        it("decodes a valid cursor, clamps oversized limits, and returns fallback labels on the final page",
            async () => {
                const query = jest.fn().mockResolvedValue([
                    row({
                        metadata: {
                            target: {
                                entityName: "CourseEntity",
                                id: "course-1",
                                label: "Course fallback",
                            },
                        },
                        reactionCount: "bad-number",
                        myReaction: "dislike",
                    }),
                ])
                const entityManager = {
                    query 
                }
                const labelResolverService = {
                    resolveLabels: jest.fn().mockResolvedValue(new Map()),
                }
                const resolver = new MyFeedResolver(entityManager as never,
            labelResolverService as never)
                const encode = (resolver as unknown as {
            encodeCursor: (asOf: string, offset: number) => string
        }).encodeCursor.bind(resolver)

                const result = await resolver.execute({
                    tab: MyFeedTab.ForYou,
                    category: MyFeedCategory.All,
                    limit: 999,
                    cursor: encode("2026-01-01T00:00:00.000Z",
                        17),
                } as never,
        {
            id: "user-1" 
        } as UserEntity,
        Locale.Vi)

                expect(query.mock.calls[0][0]).toContain("WHERE a.user_id <> $1")
                expect(query.mock.calls[0][0]).toContain("OFFSET 17")
                expect(query.mock.calls[0][0]).toContain("LIMIT 51")
                expect(query.mock.calls[0][1]).toEqual([
                    "user-1",
                    "2026-01-01T00:00:00.000Z",
                ])
                expect(result.items[0]).toEqual(expect.objectContaining({
                    targetLabel: "Course fallback",
                    reactionCount: Number.NaN,
                    myReaction: "dislike",
                }))
                expect(result.nextCursor).toBeNull()
            })

        it("treats malformed cursors as page one and resolves a target-less row",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([row({
                        metadata: null,
                    })]),
                }
                const labelResolverService = {
                    resolveLabels: jest.fn().mockResolvedValue(new Map()),
                }
                const resolver = new MyFeedResolver(entityManager as never,
            labelResolverService as never)

                const result = await resolver.execute({
                    tab: MyFeedTab.ForYou,
                    limit: 20,
                    cursor: "not-base64-json",
                } as never,
        {
            id: "user-1" 
        } as UserEntity,
        Locale.En)

                expect(entityManager.query.mock.calls[0][0]).toContain("OFFSET 0")
                expect(labelResolverService.resolveLabels).toHaveBeenCalledWith({
                    refs: [],
                    locale: Locale.En,
                })
                expect(result.items[0]).toEqual(expect.objectContaining({
                    targetGlobalId: null,
                    targetLabel: null,
                }))
            })
    })
