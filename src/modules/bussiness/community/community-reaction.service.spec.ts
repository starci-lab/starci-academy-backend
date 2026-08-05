import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CommunityReactionService,
} from "./community-reaction.service"
import {
    ReactionType,
} from "@modules/databases/postgresql/primary/enums/reaction-type"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CommunityPostCommentNotFoundException,
    CommunityPostNotFoundException,
} from "@modules/platform/exceptions/errors/community/post"
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
 * A chainable stand-in for the grouped reaction-summary query builders. Every
 * select/where/group method returns the builder; `getRawMany` is the terminal
 * the test programs (per `createQueryBuilder()` call, in call order).
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

describe("CommunityReactionService",
    () => {
        let module: TestingModule
        let service: CommunityReactionService
        let entityManager: EntityManagerMock
        let queryBuilder: ReactionQueryBuilderMock
        let eventEmitterService: jest.Mocked<Pick<EventEmitterService, "emit">>

        const postId = "post-1"
        const commentId = "comment-1"
        const user = {
            id: "user-1",
        } as unknown as UserEntity

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // one shared builder so the two-query summarizer stays programmable in order
            queryBuilder = makeReactionQueryBuilderMock()
            entityManager.createQueryBuilder = jest.fn(() => queryBuilder)

            // event bus stub
            eventEmitterService = {
                emit: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<EventEmitterService, "emit">>

            module = await Test.createTestingModule({
                providers: [
                    CommunityReactionService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                ],
            }).compile()

            service = module.get<CommunityReactionService>(CommunityReactionService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("reactToPost",
            () => {
                it("throws CommunityPostNotFoundException for a non-existent post",
                    async () => {
                        // count default resolves 0 -> post does not exist
                        await expect(
                            service.reactToPost({
                                postId,
                                user,
                                type: ReactionType.Like,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostNotFoundException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })

                it("inserts a new reaction when the user has none, then emits the change event",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        // no existing reaction; the post-mutation summary's "mine" lookup also empty
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await service.reactToPost({
                            postId,
                            user,
                            type: ReactionType.Like,
                        })

                        expect(entityManager.create).toHaveBeenCalled()
                        expect(entityManager.save).toHaveBeenCalled()
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommunityPostReactionChanged,
                            payload: {
                                postId,
                            },
                        })
                    })

                it("allows a self-reaction (liking one's own post)",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.findOne.mockResolvedValueOnce(null)

                        // unlike feed activities, community reactions do not block self-targets
                        await expect(
                            service.reactToPost({
                                postId,
                                // the reacting user IS the post's own author from the caller's
                                // point of view -- the service has no author check at all here
                                user,
                                type: ReactionType.Love,
                            }),
                        ).resolves.toBeDefined()
                    })

                it("switches the emotion in place when a reaction already exists",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        const existing = {
                            type: ReactionType.Like,
                        }
                        entityManager.findOne
                            .mockResolvedValueOnce(existing)
                            // "mine" lookup for the summarizer picks up the switched row
                            .mockResolvedValueOnce(null)

                        await service.reactToPost({
                            postId,
                            user,
                            type: ReactionType.Love,
                        })

                        expect(existing.type).toBe(ReactionType.Love)
                        expect(entityManager.create).not.toHaveBeenCalled()
                        expect(entityManager.save).toHaveBeenCalledWith(existing)
                    })

                it("removes the reaction when type is null and one exists",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        const existing = {
                            type: ReactionType.Like,
                        }
                        entityManager.findOne
                            .mockResolvedValueOnce(existing)
                            .mockResolvedValueOnce(null)

                        await service.reactToPost({
                            postId,
                            user,
                            type: null,
                        })

                        expect(entityManager.remove).toHaveBeenCalledWith(existing)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("removing when no reaction exists is a no-op (no remove call)",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await service.reactToPost({
                            postId,
                            user,
                            type: null,
                        })

                        expect(entityManager.remove).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                        // the event still fans out -- totals may have changed for other viewers
                        expect(eventEmitterService.emit).toHaveBeenCalled()
                    })
            })

        describe("reactToComment",
            () => {
                it("throws CommunityPostCommentNotFoundException for a non-existent comment",
                    async () => {
                        // findOne default resolves null -> comment does not exist
                        await expect(
                            service.reactToComment({
                                commentId,
                                user,
                                type: ReactionType.Like,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostCommentNotFoundException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })

                it("inserts a new reaction and emits CommunityCommentReactionChanged scoped to the comment's post",
                    async () => {
                        entityManager.findOne
                            // comment lookup
                            .mockResolvedValueOnce({
                                id: commentId,
                                postId,
                            })
                            // existing-reaction lookup
                            .mockResolvedValueOnce(null)
                            // "mine" lookup for the summarizer
                            .mockResolvedValueOnce(null)

                        await service.reactToComment({
                            commentId,
                            user,
                            type: ReactionType.Like,
                        })

                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommunityCommentReactionChanged,
                            payload: {
                                postId,
                                commentId,
                            },
                        })
                    })
            })

        describe("summarizePosts",
            () => {
                it("returns an empty map for an empty input (no query)",
                    async () => {
                        const result = await service.summarizePosts({
                            postIds: [],
                            userId: user.id,
                        })

                        expect(result).toEqual({
                        })
                        expect(entityManager.createQueryBuilder).not.toHaveBeenCalled()
                    })

                it("builds a summary for every requested id, even ones with zero reactions",
                    async () => {
                        // first call = grouped counts, second call = "mine" rows
                        queryBuilder.getRawMany
                            .mockResolvedValueOnce([
                                {
                                    postId: "post-a",
                                    type: ReactionType.Like,
                                    count: "2",
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    postId: "post-a",
                                    type: ReactionType.Like,
                                },
                            ])

                        const result = await service.summarizePosts({
                            postIds: [
                                "post-a",
                                "post-b",
                            ],
                            userId: user.id,
                        })

                        expect(result["post-a"]).toEqual({
                            counts: [
                                {
                                    type: ReactionType.Like,
                                    count: 2,
                                },
                            ],
                            total: 2,
                            myReaction: ReactionType.Like,
                            viewCount: 0,
                            shareCount: 0,
                        })
                        // requested but reaction-less id still gets a zeroed bucket, not undefined
                        expect(result["post-b"]).toEqual({
                            counts: [],
                            total: 0,
                            myReaction: null,
                            viewCount: 0,
                            shareCount: 0,
                        })
                    })
            })

        describe("summarizeComments",
            () => {
                it("returns an empty map for an empty input (no query)",
                    async () => {
                        const result = await service.summarizeComments({
                            commentIds: [],
                            userId: user.id,
                        })

                        expect(result).toEqual({
                        })
                        expect(entityManager.createQueryBuilder).not.toHaveBeenCalled()
                    })
            })
    })
