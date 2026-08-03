import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CommunityCommentService,
} from "./community-comment.service"
import {
    NotificationType,
} from "@modules/databases"
import type {
    UserEntity,
} from "@modules/databases"
import {
    CommunityPostCommentForbiddenException,
    CommunityPostCommentNotFoundException,
    CommunityPostNotFoundException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    NotificationService,
} from "../notification"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * A chainable stand-in for the grouped count query builders (`countReplies` /
 * `countCommentsByPosts`). Filters return the builder; `getRawMany` is the
 * terminal the test programs.
 */
interface CountQueryBuilderMock {
    /** Chainable: records the group-by column select. */
    select: jest.Mock
    /** Chainable: records the COUNT(*) select. */
    addSelect: jest.Mock
    /** Chainable: records the IN (...) WHERE. */
    where: jest.Mock
    /** Chainable: records the group-by column. */
    groupBy: jest.Mock
    /** Terminal: resolves the grouped raw rows. */
    getRawMany: jest.Mock
}

/** Build a fresh chainable grouped-count query-builder mock. */
const makeCountQueryBuilderMock = (): CountQueryBuilderMock => {
    // declare first so each chainable method can return the same instance
    const builder = {
    } as CountQueryBuilderMock
    builder.select = jest.fn(() => builder)
    builder.addSelect = jest.fn(() => builder)
    builder.where = jest.fn(() => builder)
    builder.groupBy = jest.fn(() => builder)
    // terminal resolves "nothing" until a test programs it
    builder.getRawMany = jest.fn().mockResolvedValue([])
    return builder
}

describe("CommunityCommentService",
    () => {
        let module: TestingModule
        let service: CommunityCommentService
        let entityManager: EntityManagerMock
        let countQueryBuilder: CountQueryBuilderMock
        let eventEmitterService: jest.Mocked<Pick<EventEmitterService, "emit">>
        let notificationService: jest.Mocked<Pick<NotificationService, "createNotification">>

        const postId = "post-1"
        const commentId = "comment-1"
        const commenter = {
            id: "user-1",
            username: "commenter",
        } as unknown as UserEntity

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // override createQueryBuilder for the grouped count queries
            countQueryBuilder = makeCountQueryBuilderMock()
            entityManager.createQueryBuilder = jest.fn(() => countQueryBuilder)

            // event bus stub — every mutation fans out a room event
            eventEmitterService = {
                emit: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<EventEmitterService, "emit">>

            // notification fan-out stub — createComment notifies post/parent authors
            notificationService = {
                createNotification: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<NotificationService, "createNotification">>

            module = await Test.createTestingModule({
                providers: [
                    CommunityCommentService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                    {
                        provide: NotificationService,
                        useValue: notificationService,
                    },
                ],
            }).compile()

            service = module.get<CommunityCommentService>(CommunityCommentService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getCommentOrThrow",
            () => {
                it("throws CommunityPostCommentNotFoundException when the row is missing",
                    async () => {
                        await expect(
                            service.getCommentOrThrow(commentId),
                        ).rejects.toBeInstanceOf(CommunityPostCommentNotFoundException)
                    })
            })

        describe("createComment",
            () => {
                it("throws CommunityPostNotFoundException when the post does not exist",
                    async () => {
                        // post lookup default resolves null
                        await expect(
                            service.createComment({
                                postId,
                                body: "hi",
                                user: commenter,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostNotFoundException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("throws CommunityPostCommentNotFoundException when replying to a non-existent parent",
                    async () => {
                        // post resolves, but the parent comment lookup misses
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: postId,
                                author: {
                                    id: "post-author",
                                },
                            })
                            .mockResolvedValueOnce(null)

                        await expect(
                            service.createComment({
                                postId,
                                parentCommentId: "ghost",
                                body: "reply",
                                user: commenter,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostCommentNotFoundException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })

                it("creates a top-level comment, emits CommunityCommentCreated, and notifies the post author",
                    async () => {
                        entityManager.findOne
                            // post lookup
                            .mockResolvedValueOnce({
                                id: postId,
                                author: {
                                    id: "post-author",
                                },
                            })
                            // reload-after-save
                            .mockResolvedValueOnce({
                                id: commentId,
                                postId,
                                parentCommentId: null,
                            })
                        entityManager.save.mockResolvedValueOnce({
                            id: commentId,
                        })

                        const result = await service.createComment({
                            postId,
                            body: "hi",
                            user: commenter,
                        })

                        expect(result.id).toBe(commentId)
                        // a top-level comment carries a null parent
                        const draft = entityManager.create.mock.calls[0][1] as {
                            parentComment: unknown
                        }
                        expect(draft.parentComment).toBeNull()
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommunityCommentCreated,
                            payload: {
                                postId,
                                commentId,
                                parentCommentId: null,
                            },
                        })
                        // notified the post author (not a reply → no parent-author target)
                        expect(notificationService.createNotification).toHaveBeenCalledTimes(1)
                        expect(notificationService.createNotification).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "post-author",
                                type: NotificationType.CommunityReply,
                            }),
                        )
                    })

                it("never notifies the actor about their own comment (self-post)",
                    async () => {
                        entityManager.findOne
                            // the commenter is ALSO the post's author
                            .mockResolvedValueOnce({
                                id: postId,
                                author: {
                                    id: commenter.id,
                                },
                            })
                            .mockResolvedValueOnce({
                                id: commentId,
                                postId,
                                parentCommentId: null,
                            })
                        entityManager.save.mockResolvedValueOnce({
                            id: commentId,
                        })

                        await service.createComment({
                            postId,
                            body: "hi",
                            user: commenter,
                        })

                        expect(notificationService.createNotification).not.toHaveBeenCalled()
                    })

                it("notifies both the post author and the parent comment author on a reply (deduped)",
                    async () => {
                        entityManager.findOne
                            // post lookup
                            .mockResolvedValueOnce({
                                id: postId,
                                author: {
                                    id: "post-author",
                                },
                            })
                            // parent comment lookup (getCommentOrThrow)
                            .mockResolvedValueOnce({
                                id: "parent-1",
                                userId: "parent-author",
                            })
                            // reload-after-save
                            .mockResolvedValueOnce({
                                id: commentId,
                                postId,
                                parentCommentId: "parent-1",
                            })
                        entityManager.save.mockResolvedValueOnce({
                            id: commentId,
                        })

                        await service.createComment({
                            postId,
                            parentCommentId: "parent-1",
                            body: "reply",
                            user: commenter,
                        })

                        expect(notificationService.createNotification).toHaveBeenCalledTimes(2)
                        const notifiedUserIds = notificationService.createNotification.mock.calls
                            .map((call) => (call[0] as {
                                userId: string
                            }).userId)
                        expect(notifiedUserIds).toEqual(
                            expect.arrayContaining([
                                "post-author",
                                "parent-author",
                            ]),
                        )
                    })

                it("does not double-notify when the post author and parent author are the same person",
                    async () => {
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: postId,
                                author: {
                                    id: "same-author",
                                },
                            })
                            .mockResolvedValueOnce({
                                id: "parent-1",
                                userId: "same-author",
                            })
                            .mockResolvedValueOnce({
                                id: commentId,
                                postId,
                                parentCommentId: "parent-1",
                            })
                        entityManager.save.mockResolvedValueOnce({
                            id: commentId,
                        })

                        await service.createComment({
                            postId,
                            parentCommentId: "parent-1",
                            body: "reply",
                            user: commenter,
                        })

                        // de-duped to ONE recipient even though both roles resolve to them
                        expect(notificationService.createNotification).toHaveBeenCalledTimes(1)
                    })
            })

        describe("updateComment",
            () => {
                it("edits the body, stamps editedAt, and emits CommunityCommentUpdated when the author matches",
                    async () => {
                        const comment = {
                            id: commentId,
                            userId: commenter.id,
                            postId,
                            parentCommentId: null,
                            body: "old",
                            editedAt: null as Date | null,
                        }
                        entityManager.findOne.mockResolvedValueOnce(comment)

                        const result = await service.updateComment({
                            commentId,
                            body: "new",
                            user: commenter,
                        })

                        expect(result.body).toBe("new")
                        expect(comment.editedAt).toBeInstanceOf(Date)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommunityCommentUpdated,
                            payload: {
                                postId,
                                commentId,
                                parentCommentId: null,
                            },
                        })
                    })

                it("rejects an edit from a non-author with CommunityPostCommentForbiddenException",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: commentId,
                            userId: "other-user",
                        })

                        await expect(
                            service.updateComment({
                                commentId,
                                body: "new",
                                user: commenter,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostCommentForbiddenException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })
            })

        describe("softDeleteComment",
            () => {
                it("flags the comment deleted and emits CommunityCommentDeleted when the author matches",
                    async () => {
                        const comment = {
                            id: commentId,
                            userId: commenter.id,
                            postId,
                            parentCommentId: null,
                            isDeleted: false,
                        }
                        entityManager.findOne.mockResolvedValueOnce(comment)

                        const result = await service.softDeleteComment({
                            commentId,
                            user: commenter,
                        })

                        expect(result).toEqual({
                            id: commentId,
                        })
                        expect(comment.isDeleted).toBe(true)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommunityCommentDeleted,
                            payload: {
                                postId,
                                commentId,
                                parentCommentId: null,
                            },
                        })
                    })

                it("rejects a delete from a non-author with CommunityPostCommentForbiddenException",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: commentId,
                            userId: "other-user",
                            isDeleted: false,
                        })

                        await expect(
                            service.softDeleteComment({
                                commentId,
                                user: commenter,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostCommentForbiddenException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })
            })

        describe("listComments",
            () => {
                it("lists top-level comments when no parent is given",
                    async () => {
                        entityManager.findAndCount.mockResolvedValueOnce([
                            [],
                            0,
                        ])

                        await service.listComments({
                            postId,
                            page: 2,
                            limit: 10,
                        })

                        const options = entityManager.findAndCount.mock.calls[0][1] as {
                            skip: number
                            take: number
                        }
                        // page 2 of size 10 → offset 10
                        expect(options.skip).toBe(10)
                        expect(options.take).toBe(10)
                    })

                it("clamps a page below 1 to a zero offset",
                    async () => {
                        entityManager.findAndCount.mockResolvedValueOnce([
                            [],
                            0,
                        ])

                        await service.listComments({
                            postId,
                            page: 0,
                            limit: 20,
                        })

                        const options = entityManager.findAndCount.mock.calls[0][1] as {
                            skip: number
                        }
                        expect(options.skip).toBe(0)
                    })
            })

        describe("countReplies",
            () => {
                it("returns an empty map for an empty input (no query)",
                    async () => {
                        const result = await service.countReplies([])

                        expect(result).toEqual({
                        })
                        expect(entityManager.createQueryBuilder).not.toHaveBeenCalled()
                    })

                it("folds grouped rows into a parent-id -> count map",
                    async () => {
                        countQueryBuilder.getRawMany.mockResolvedValueOnce([
                            {
                                parentId: "p1",
                                count: "3",
                            },
                        ])

                        const result = await service.countReplies([
                            "p1",
                        ])

                        expect(result).toEqual({
                            p1: 3,
                        })
                    })
            })

        describe("countCommentsByPosts",
            () => {
                it("returns an empty map for an empty input (no query)",
                    async () => {
                        const result = await service.countCommentsByPosts([])

                        expect(result).toEqual({
                        })
                        expect(entityManager.createQueryBuilder).not.toHaveBeenCalled()
                    })

                it("folds grouped rows into a post-id -> count map",
                    async () => {
                        countQueryBuilder.getRawMany.mockResolvedValueOnce([
                            {
                                postId: "post-a",
                                count: "5",
                            },
                        ])

                        const result = await service.countCommentsByPosts([
                            "post-a",
                        ])

                        expect(result).toEqual({
                            "post-a": 5,
                        })
                    })
            })
    })
