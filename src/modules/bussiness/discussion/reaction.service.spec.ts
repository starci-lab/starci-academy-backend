import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ReactionService,
} from "./reaction.service"
import {
    ReactionType,
} from "@modules/databases"
import {
    CommentNotFoundException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * A chainable stand-in for the grouped reaction-count query builders. Every
 * select/where/group method returns the builder; `getRawMany` is the terminal
 * the test programs (per createQueryBuilder() call, in order).
 */
interface ReactionQueryBuilderMock {
    /** Chainable: records a select column. */
    select: jest.Mock
    /** Chainable: records an additional select column. */
    addSelect: jest.Mock
    /** Chainable: records the root WHERE. */
    where: jest.Mock
    /** Chainable: records an additional AND clause. */
    andWhere: jest.Mock
    /** Chainable: records a group-by column. */
    groupBy: jest.Mock
    /** Chainable: records an additional group-by column. */
    addGroupBy: jest.Mock
    /** Terminal: resolves the grouped raw rows. */
    getRawMany: jest.Mock
}

/** Build a fresh chainable reaction query-builder mock. */
const makeReactionQueryBuilderMock = (): ReactionQueryBuilderMock => {
    // declare first so each chainable method can return the same instance
    const builder = {
    } as ReactionQueryBuilderMock
    builder.select = jest.fn(() => builder)
    builder.addSelect = jest.fn(() => builder)
    builder.where = jest.fn(() => builder)
    builder.andWhere = jest.fn(() => builder)
    builder.groupBy = jest.fn(() => builder)
    builder.addGroupBy = jest.fn(() => builder)
    // terminal resolves "no rows" until a test programs it
    builder.getRawMany = jest.fn().mockResolvedValue([])
    return builder
}

describe("ReactionService",
    () => {
        let module: TestingModule
        let service: ReactionService
        let entityManager: EntityManagerMock
        let queryBuilder: ReactionQueryBuilderMock
        let eventEmitterService: jest.Mocked<Pick<EventEmitterService, "emit">>
        let cacheService: jest.Mocked<CacheService>

        const contentId = "content-1"
        const commentId = "comment-1"
        const user = {
            id: "user-1",
        }

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // remove + count are not on the shared mock — add them here
            entityManager.remove = jest.fn().mockResolvedValue(undefined)
            entityManager.count = jest.fn().mockResolvedValue(0)
            // one shared builder so chained grouped queries stay programmable in order
            queryBuilder = makeReactionQueryBuilderMock()
            entityManager.createQueryBuilder = jest.fn(() => queryBuilder)

            // event bus + cache stubs
            eventEmitterService = {
                emit: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<EventEmitterService, "emit">>
            cacheService = {
                get: jest.fn(),
                set: jest.fn(),
                del: jest.fn(),
            } as unknown as jest.Mocked<CacheService>

            module = await Test.createTestingModule({
                providers: [
                    ReactionService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                    {
                        provide: CacheService,
                        useValue: cacheService,
                    },
                ],
            }).compile()

            service = module.get<ReactionService>(ReactionService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("reactToContent",
            () => {
                it("inserts a new reaction when the user has none, then emits + summarizes",
                    async () => {
                        // no existing reaction; the post-mutation summary's "mine" lookup also null
                        entityManager.findOne.mockResolvedValue(null)
                        // view-count cache hit avoids the DB count path
                        cacheService.get.mockResolvedValue(5)

                        const result = await service.reactToContent({
                            contentId,
                            user,
                            type: ReactionType.Like,
                        })

                        // first-time reaction → a new row was created + saved
                        expect(entityManager.create).toHaveBeenCalled()
                        expect(entityManager.save).toHaveBeenCalled()
                        // fanned out the content reaction-changed event
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.ContentReactionChanged,
                            payload: {
                                contentId,
                            },
                        })
                        // returns the recomputed summary (view count carried through)
                        expect(result.viewCount).toBe(5)
                        expect(result.shareCount).toBe(0)
                    })

                it("switches the emotion in place when a reaction already exists",
                    async () => {
                        const existing = {
                            type: ReactionType.Like,
                        }
                        // existing reaction for the mutation; summary "mine" lookup resolves null
                        entityManager.findOne
                            .mockResolvedValueOnce(existing)
                            .mockResolvedValueOnce(null)
                        cacheService.get.mockResolvedValue(0)

                        await service.reactToContent({
                            contentId,
                            user,
                            type: ReactionType.Love,
                        })

                        // emotion swapped on the loaded row (no new insert)
                        expect(existing.type).toBe(ReactionType.Love)
                        expect(entityManager.create).not.toHaveBeenCalled()
                        expect(entityManager.save).toHaveBeenCalledWith(existing)
                    })

                it("removes the reaction when type is null and one exists",
                    async () => {
                        const existing = {
                            type: ReactionType.Like,
                        }
                        entityManager.findOne
                            .mockResolvedValueOnce(existing)
                            .mockResolvedValueOnce(null)
                        cacheService.get.mockResolvedValue(0)

                        await service.reactToContent({
                            contentId,
                            user,
                            type: null,
                        })

                        // null type deletes the existing row
                        expect(entityManager.remove).toHaveBeenCalledWith(existing)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("is a no-op delete when type is null and no reaction exists",
                    async () => {
                        entityManager.findOne.mockResolvedValue(null)
                        cacheService.get.mockResolvedValue(0)

                        await service.reactToContent({
                            contentId,
                            user,
                            type: null,
                        })

                        // nothing to remove or save
                        expect(entityManager.remove).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })

        describe("reactToComment",
            () => {
                it("throws CommentNotFoundException when the comment is missing",
                    async () => {
                        // comment lookup resolves null
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            service.reactToComment({
                                commentId,
                                user,
                                type: ReactionType.Like,
                            }),
                        ).rejects.toBeInstanceOf(CommentNotFoundException)
                    })

                it("inserts a comment reaction and returns this comment's summary bucket",
                    async () => {
                        entityManager.findOne
                            // comment exists (carries the content id for the room event)
                            .mockResolvedValueOnce({
                                id: commentId,
                                contentId,
                            })
                            // no existing reaction by this user
                            .mockResolvedValueOnce(null)

                        const result = await service.reactToComment({
                            commentId,
                            user,
                            type: ReactionType.Like,
                        })

                        // emitted the comment reaction-changed event scoped to the content
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommentReactionChanged,
                            payload: {
                                contentId,
                                commentId,
                            },
                        })
                        // summary present for the comment (empty: no count rows programmed)
                        expect(result.total).toBe(0)
                        expect(result.myReaction).toBeNull()
                    })
            })

        describe("getViewCount",
            () => {
                it("returns the cached view count without querying the DB",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(42)

                        const result = await service.getViewCount(contentId)

                        expect(result).toBe(42)
                        expect(entityManager.count).not.toHaveBeenCalled()
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })

                it("counts distinct readers on a miss and caches the result",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.count.mockResolvedValueOnce(7)

                        const result = await service.getViewCount(contentId)

                        expect(result).toBe(7)
                        // cached the freshly computed count under the view-count key
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.ContentViewCount,
                            args: [
                                contentId,
                            ],
                            cacheResult: 7,
                        })
                    })
            })

        describe("invalidateViewCount",
            () => {
                it("evicts the cached view count for the content",
                    async () => {
                        await service.invalidateViewCount(contentId)

                        expect(cacheService.del).toHaveBeenCalledWith({
                            key: CacheKey.ContentViewCount,
                            args: [
                                contentId,
                            ],
                        })
                    })
            })

        describe("summarizeContent",
            () => {
                it("aggregates per-emotion counts, the user's pick, and the view count",
                    async () => {
                        // grouped counts for the content
                        queryBuilder.getRawMany.mockResolvedValueOnce([
                            {
                                type: ReactionType.Like,
                                count: "3",
                            },
                            {
                                type: ReactionType.Love,
                                count: "2",
                            },
                        ])
                        // the viewing user's own reaction
                        entityManager.findOne.mockResolvedValueOnce({
                            type: ReactionType.Like,
                        })
                        // cached view count
                        cacheService.get.mockResolvedValueOnce(9)

                        const result = await service.summarizeContent({
                            contentId,
                            userId: user.id,
                        })

                        // total is the sum across emotion buckets
                        expect(result.total).toBe(5)
                        expect(result.myReaction).toBe(ReactionType.Like)
                        expect(result.viewCount).toBe(9)
                        expect(result.shareCount).toBe(0)
                    })

                it("reports a null myReaction when the user has not reacted",
                    async () => {
                        queryBuilder.getRawMany.mockResolvedValueOnce([])
                        // no personal reaction row
                        entityManager.findOne.mockResolvedValueOnce(null)
                        cacheService.get.mockResolvedValueOnce(0)

                        const result = await service.summarizeContent({
                            contentId,
                            userId: user.id,
                        })

                        expect(result.total).toBe(0)
                        expect(result.myReaction).toBeNull()
                    })
            })

        describe("summarizeComments",
            () => {
                it("returns an empty map for an empty input (no queries)",
                    async () => {
                        const result = await service.summarizeComments({
                            commentIds: [],
                            userId: user.id,
                        })

                        expect(result).toEqual({
                        })
                        expect(entityManager.createQueryBuilder).not.toHaveBeenCalled()
                    })

                it("buckets counts + the user's pick per comment, present for every id",
                    async () => {
                        queryBuilder.getRawMany
                            // grouped (comment, emotion) counts
                            .mockResolvedValueOnce([
                                {
                                    commentId: "c1",
                                    type: ReactionType.Like,
                                    count: "2",
                                },
                                {
                                    commentId: "c1",
                                    type: ReactionType.Love,
                                    count: "1",
                                },
                            ])
                            // the user's own reaction per comment
                            .mockResolvedValueOnce([
                                {
                                    commentId: "c1",
                                    type: ReactionType.Like,
                                },
                            ])

                        const result = await service.summarizeComments({
                            commentIds: [
                                "c1",
                                "c2",
                            ],
                            userId: user.id,
                        })

                        // c1 has 3 reactions and the user picked Like
                        expect(result.c1.total).toBe(3)
                        expect(result.c1.myReaction).toBe(ReactionType.Like)
                        // every requested id is present, even with no reactions
                        expect(result.c2.total).toBe(0)
                        expect(result.c2.myReaction).toBeNull()
                    })
            })
    })
