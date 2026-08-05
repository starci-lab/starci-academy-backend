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
    ContentEngagementProjectionService,
} from "../projections/content-engagement/content-engagement-projection.service"
import type {
    ContentEngagementSummary,
} from "../projections/content-engagement/types"
import {
    UserService,
} from "../user/user.service"
import {
    ReactionType,
} from "@modules/databases/postgresql/primary/enums/reaction-type"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CommentNotFoundException,
} from "@modules/platform/exceptions/errors/discussion/comment"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * A chainable stand-in for the grouped comment-reaction query builders. Every
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

/** Build an engagement summary with zeroed defaults, overridable per test. */
const makeSummary = (
    overrides: Partial<ContentEngagementSummary> = {
    },
): ContentEngagementSummary => ({
    totalReactions: 0,
    reactionsByType: {
    } as Record<ReactionType, number>,
    viewCount: 0,
    shareCount: 0,
    commentCount: 0,
    ...overrides,
})

describe("ReactionService",
    () => {
        let module: TestingModule
        let service: ReactionService
        let entityManager: EntityManagerMock
        let queryBuilder: ReactionQueryBuilderMock
        let eventEmitterService: jest.Mocked<Pick<EventEmitterService, "emit">>
        let contentEngagementProjectionService: jest.Mocked<
            Pick<ContentEngagementProjectionService, "getSummary" | "recompute">
        >
        let userService: {
            resolveOrCreateTrialEnrollment: jest.Mock
        }

        const contentId = "content-1"
        const commentId = "comment-1"
        const user = {
            id: "user-1",
        } as unknown as UserEntity

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // remove is not on the shared mock -- add it here
            entityManager.remove = jest.fn().mockResolvedValue(undefined)
            // one shared builder so chained grouped queries stay programmable in order
            queryBuilder = makeReactionQueryBuilderMock()
            entityManager.createQueryBuilder = jest.fn(() => queryBuilder)

            // event bus stub
            eventEmitterService = {
                emit: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<EventEmitterService, "emit">>
            // engagement projection stub: reads return zeroed summary, recompute is a no-op
            contentEngagementProjectionService = {
                getSummary: jest.fn().mockResolvedValue(makeSummary()),
                recompute: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<
                Pick<ContentEngagementProjectionService, "getSummary" | "recompute">
            >
            // trial-enrollment resolver stub: content reactions rarely need it,
            // so default to null (no enrollment resolved); program per-test
            userService = {
                resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue(null),
            }

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
                        provide: ContentEngagementProjectionService,
                        useValue: contentEngagementProjectionService,
                    },
                    {
                        provide: UserService,
                        useValue: userService,
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
                it("inserts a new reaction when the user has none, then emits + recomputes + summarizes",
                    async () => {
                        // no existing reaction; the post-mutation summary's "mine" lookup also null
                        entityManager.findOne.mockResolvedValue(null)
                        // projection reports the content's view count for the returned summary
                        contentEngagementProjectionService.getSummary.mockResolvedValue(
                            makeSummary({
                                viewCount: 5,
                            }),
                        )

                        const result = await service.reactToContent({
                            contentId,
                            user,
                            type: ReactionType.Like,
                        })

                        // first-time reaction -> a new row was created + saved
                        expect(entityManager.create).toHaveBeenCalled()
                        expect(entityManager.save).toHaveBeenCalled()
                        // fanned out the content reaction-changed event
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.ContentReactionChanged,
                            payload: {
                                contentId,
                            },
                        })
                        // refreshed the engagement projection inline
                        expect(contentEngagementProjectionService.recompute).toHaveBeenCalledWith({
                            contentId,
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
                it("returns the view count from the engagement projection",
                    async () => {
                        contentEngagementProjectionService.getSummary.mockResolvedValueOnce(
                            makeSummary({
                                viewCount: 42,
                            }),
                        )

                        const result = await service.getViewCount(contentId)

                        expect(result).toBe(42)
                        expect(contentEngagementProjectionService.getSummary).toHaveBeenCalledWith(contentId)
                    })
            })

        describe("invalidateViewCount",
            () => {
                it("recomputes the content's engagement projection",
                    async () => {
                        await service.invalidateViewCount(contentId)

                        expect(contentEngagementProjectionService.recompute).toHaveBeenCalledWith({
                            contentId,
                        })
                    })
            })

        describe("summarizeContent",
            () => {
                it("expands projection counters + the user's pick into the summary",
                    async () => {
                        // projection counters for the content (per-emotion map + view)
                        contentEngagementProjectionService.getSummary.mockResolvedValueOnce(
                            makeSummary({
                                totalReactions: 5,
                                reactionsByType: {
                                    [ReactionType.Like]: 3,
                                    [ReactionType.Love]: 2,
                                } as Record<ReactionType, number>,
                                viewCount: 9,
                            }),
                        )
                        // the viewing user's own reaction
                        entityManager.findOne.mockResolvedValueOnce({
                            type: ReactionType.Like,
                        })

                        const result = await service.summarizeContent({
                            contentId,
                            userId: user.id,
                        })

                        // total carried straight from the projection
                        expect(result.total).toBe(5)
                        expect(result.myReaction).toBe(ReactionType.Like)
                        expect(result.viewCount).toBe(9)
                        expect(result.shareCount).toBe(0)
                        // counts array expanded from the per-emotion map
                        expect(result.counts).toHaveLength(2)
                    })

                it("reports a null myReaction when the user has not reacted",
                    async () => {
                        contentEngagementProjectionService.getSummary.mockResolvedValueOnce(makeSummary())
                        // no personal reaction row
                        entityManager.findOne.mockResolvedValueOnce(null)

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
