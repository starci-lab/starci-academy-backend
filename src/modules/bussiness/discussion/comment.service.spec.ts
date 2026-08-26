import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CommentService,
} from "./comment.service"
import {
    ContentCommentEntity,
} from "@modules/databases/postgresql/primary/entities/content-comment.entity"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CommentForbiddenException,
    CommentInvalidScopeException,
    CommentNotFoundException,
} from "@modules/platform/exceptions/errors/discussion/comment"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    CourseQuestionFilter,
} from "./types/comment"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * A chainable stand-in for the grouped reply-count query builder. Filters
 * return the builder; `getRawMany` is the terminal the test programs.
 */
interface CountQueryBuilderMock {
    /** Chainable: records the parent-id select. */
    select: jest.Mock
    /** Chainable: records the COUNT(*) select. */
    addSelect: jest.Mock
    /** Chainable: records the IN (...) WHERE. */
    where: jest.Mock
    /** Chainable: records the group-by-parent. */
    groupBy: jest.Mock
    /** Terminal: resolves the `{ parentId, count }` rows. */
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
    // terminal resolves "no replies" until a test programs it
    builder.getRawMany = jest.fn().mockResolvedValue([])
    return builder
}

describe("CommentService",
    () => {
        let module: TestingModule
        let service: CommentService
        let entityManager: EntityManagerMock
        let countQueryBuilder: CountQueryBuilderMock
        let eventEmitterService: jest.Mocked<Pick<EventEmitterService, "emit">>

        const contentId = "content-1"
        const commentId = "comment-1"
        // minimal author stand-in -- the service only ever reads `user.id`
        const author = {
            id: "user-1",
        } as unknown as UserEntity

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // findAndCount is not on the shared mock -- add it for the listing path
            entityManager.findAndCount = jest.fn().mockResolvedValue([
                [],
                0,
            ])
            // override createQueryBuilder for the grouped reply-count query
            countQueryBuilder = makeCountQueryBuilderMock()
            entityManager.createQueryBuilder = jest.fn(() => countQueryBuilder)

            // event bus stub -- every mutation fans out a room event
            eventEmitterService = {
                emit: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<EventEmitterService, "emit">>

            module = await Test.createTestingModule({
                providers: [
                    CommentService,
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

            service = module.get<CommentService>(CommentService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getCommentOrThrow",
            () => {
                it("returns the comment with its author loaded",
                    async () => {
                        const comment = {
                            id: commentId,
                        }
                        entityManager.findOne.mockResolvedValueOnce(comment)

                        const result = await service.getCommentOrThrow(commentId)

                        expect(result).toBe(comment)
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            ContentCommentEntity,
                            {
                                where: {
                                    id: commentId,
                                },
                                relations: {
                                    user: true,
                                },
                            },
                        )
                    })

                it("throws CommentNotFoundException when the row is missing",
                    async () => {
                        // findOne default resolves null -> no such comment
                        await expect(
                            service.getCommentOrThrow(commentId),
                        ).rejects.toBeInstanceOf(CommentNotFoundException)
                    })
            })

        describe("createComment",
            () => {
                it("creates a top-level comment and emits CommentCreated",
                    async () => {
                        // save echoes the draft (carrying a generated id)
                        entityManager.save.mockResolvedValueOnce({
                            id: commentId,
                        })
                        // the reload after save resolves the persisted node
                        entityManager.findOne.mockResolvedValueOnce({
                            id: commentId,
                            parentCommentId: null,
                        })

                        const result = await service.createComment({
                            contentId,
                            parentCommentId: undefined,
                            body: "hi",
                            user: author,
                        })

                        expect(result.id).toBe(commentId)
                        // a top-level comment carries a null parent
                        const draft = entityManager.create.mock.calls[0][1] as {
                            parentComment: unknown
                        }
                        expect(draft.parentComment).toBeNull()
                        // fanned out the created event to the content room
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommentCreated,
                            payload: {
                                contentId,
                                commentId,
                                parentCommentId: null,
                            },
                        })
                    })

                it("verifies the parent exists before persisting a reply",
                    async () => {
                        entityManager.findOne
                            // parent existence check resolves a row
                            .mockResolvedValueOnce({
                                id: "parent-1",
                            })
                            // reload-after-save resolves the new reply node
                            .mockResolvedValueOnce({
                                id: commentId,
                                parentCommentId: "parent-1",
                            })
                        entityManager.save.mockResolvedValueOnce({
                            id: commentId,
                        })

                        await service.createComment({
                            contentId,
                            parentCommentId: "parent-1",
                            body: "reply",
                            user: author,
                        })

                        // the draft links to the parent via relation id
                        const draft = entityManager.create.mock.calls[0][1] as {
                            parentComment: {
                                id: string
                            }
                        }
                        expect(draft.parentComment).toEqual({
                            id: "parent-1",
                        })
                    })

                it("creates a course-general question without emitting a content-room event",
                    async () => {
                        entityManager.save.mockResolvedValueOnce({
                            id: commentId,
                        })
                        entityManager.findOne.mockResolvedValueOnce({
                            id: commentId,
                            courseId: "course-1",
                            contentId: null,
                            parentCommentId: null,
                        })

                        await service.createComment({
                            courseId: "course-1",
                            body: "course question",
                            user: author,
                        })

                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                        expect(entityManager.create).toHaveBeenCalledWith(ContentCommentEntity,
                            expect.objectContaining({
                                course: {
                                    id: "course-1",
                                },
                                content: null,
                            }))
                    })

                it("throws when replying to a non-existent parent",
                    async () => {
                        // parent existence check finds nothing
                        await expect(
                            service.createComment({
                                contentId,
                                parentCommentId: "ghost",
                                body: "reply",
                                user: author,
                            }),
                        ).rejects.toBeInstanceOf(CommentNotFoundException)
                        // never persisted nor emitted on the failure path
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })
            })

        describe("updateComment",
            () => {
                it("edits the body, stamps editedAt, and emits CommentUpdated",
                    async () => {
                        const comment = {
                            id: commentId,
                            userId: author.id,
                            contentId,
                            parentCommentId: null,
                            body: "old",
                            editedAt: null as Date | null,
                        }
                        entityManager.findOne.mockResolvedValueOnce(comment)

                        const result = await service.updateComment({
                            commentId,
                            body: "new",
                            user: author,
                        })

                        expect(result.body).toBe("new")
                        // the edit time is stamped so the UI can show "(edited)"
                        expect(comment.editedAt).toBeInstanceOf(Date)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommentUpdated,
                            payload: {
                                contentId,
                                commentId,
                                parentCommentId: null,
                            },
                        })
                    })

                it("rejects an edit from a non-author",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: commentId,
                            // owned by someone else
                            userId: "other-user",
                        })

                        await expect(
                            service.updateComment({
                                commentId,
                                body: "new",
                                user: author,
                            }),
                        ).rejects.toBeInstanceOf(CommentForbiddenException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })

        describe("softDeleteComment",
            () => {
                it("flags the comment deleted and emits CommentDeleted",
                    async () => {
                        const comment = {
                            id: commentId,
                            userId: author.id,
                            contentId,
                            parentCommentId: null,
                            isDeleted: false,
                        }
                        entityManager.findOne.mockResolvedValueOnce(comment)

                        const result = await service.softDeleteComment({
                            commentId,
                            user: author,
                        })

                        expect(result).toEqual({
                            id: commentId,
                        })
                        // soft delete keeps the row + replies but marks it removed
                        expect(comment.isDeleted).toBe(true)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommentDeleted,
                            payload: {
                                contentId,
                                commentId,
                                parentCommentId: null,
                            },
                        })
                    })

                it("rejects a delete from a non-author",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: commentId,
                            userId: "other-user",
                            isDeleted: false,
                        })

                        await expect(
                            service.softDeleteComment({
                                commentId,
                                user: author,
                            }),
                        ).rejects.toBeInstanceOf(CommentForbiddenException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("updates and deletes course-general comments without room events",
                    async () => {
                        const comment = {
                            id: commentId,
                            userId: author.id,
                            contentId: null,
                            parentCommentId: null,
                            body: "old",
                            editedAt: null as Date | null,
                            isDeleted: false,
                        }
                        entityManager.findOne
                            .mockResolvedValueOnce(comment)
                            .mockResolvedValueOnce(comment)

                        await service.updateComment({
                            commentId,
                            body: "edited",
                            user: author,
                        })
                        await service.softDeleteComment({
                            commentId,
                            user: author,
                        })

                        expect(comment.body).toBe("edited")
                        expect(comment.isDeleted).toBe(true)
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })
            })

        describe("listComments",
            () => {
                it("lists top-level comments when no parent is given",
                    async () => {
                        const comments = [
                            {
                                id: commentId,
                            },
                        ]
                        entityManager.findAndCount.mockResolvedValueOnce([
                            comments,
                            1,
                        ])

                        const result = await service.listComments({
                            contentId,
                            parentCommentId: undefined,
                            page: 2,
                            limit: 10,
                        })

                        expect(result).toEqual({
                            comments,
                            total: 1,
                        })
                        // page 2 of size 10 -> offset 10
                        const options = entityManager.findAndCount.mock.calls[0][1] as {
                            skip: number
                            take: number
                        }
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
                            contentId,
                            page: 0,
                            limit: 20,
                        })

                        // Math.max(0, page - 1) protects against a negative offset
                        const options = entityManager.findAndCount.mock.calls[0][1] as {
                            skip: number
                        }
                        expect(options.skip).toBe(0)
                    })

                it("rejects a list scope that does not identify exactly one parent or owner",
                    async () => {
                        await expect(
                            service.listComments({
                                page: 1,
                                limit: 10,
                            }),
                        ).rejects.toBeInstanceOf(CommentInvalidScopeException)
                        expect(entityManager.findAndCount).not.toHaveBeenCalled()
                    })

                it("lists replies by parent scope without requiring a content or course id",
                    async () => {
                        entityManager.findAndCount.mockResolvedValueOnce([[{
                            id: "reply-1"
                        }],
                        1])

                        await expect(service.listComments({
                            parentCommentId: "parent-1",
                            page: 1,
                            limit: 5,
                        })).resolves.toEqual({
                            comments: [{
                                id: "reply-1"
                            }], total: 1
                        })

                        expect(entityManager.findAndCount).toHaveBeenCalledWith(ContentCommentEntity,
                            expect.objectContaining({
                                where: {
                                    parentComment: {
                                        id: "parent-1"
                                    }
                                },
                            }))
                    })

                it("uses default pagination for a valid course scope",
                    async () => {
                        entityManager.findAndCount.mockResolvedValueOnce([[],
                            0])

                        await expect(service.listComments({
                            courseId: "course-1",
                        })).resolves.toEqual({
                            comments: [],
                            total: 0,
                        })

                        expect(entityManager.findAndCount).toHaveBeenCalledWith(
                            ContentCommentEntity,
                            expect.objectContaining({
                                skip: 0,
                                take: 20,
                            }),
                        )
                    })

                it("rejects a top-level scope that supplies both content and course",
                    async () => {
                        await expect(service.listComments({
                            contentId: "content-1",
                            courseId: "course-1",
                        })).rejects.toBeInstanceOf(CommentInvalidScopeException)
                        expect(entityManager.findAndCount).not.toHaveBeenCalled()
                    })
            })

        describe("listCourseQuestions",
            () => {
                const makeBuilder = () => {
                    const builder = {
                    } as Record<string, jest.Mock>
                    for (const method of [
                        "leftJoin",
                        "leftJoinAndSelect",
                        "where",
                        "andWhere",
                        "orderBy",
                        "skip",
                        "take",
                        "innerJoin",
                        "select",
                        "addSelect",
                        "groupBy",
                        "addGroupBy",
                    ]) {
                        builder[method] = jest.fn(() => builder)
                    }
                    builder.getManyAndCount = jest.fn().mockResolvedValue([
                        [{
                            id: "question-1",
                        }],
                        1,
                    ])
                    builder.getRawMany = jest.fn().mockResolvedValue([])
                    return builder
                }

                it("applies unanswered filtering, pagination, and zero aggregate fallbacks",
                    async () => {
                        const questionBuilder = makeBuilder()
                        const countBuilder = makeBuilder()
                        const founderBuilder = makeBuilder()
                        entityManager.createQueryBuilder = jest.fn()
                            .mockReturnValueOnce(questionBuilder)
                            .mockReturnValueOnce(countBuilder)
                            .mockReturnValueOnce(founderBuilder)

                        const result = await service.listCourseQuestions({
                            courseId: "course-1",
                            filter: CourseQuestionFilter.Unanswered,
                            search: "   ",
                            page: 2,
                            limit: 5,
                            userId: author.id,
                        })

                        expect(result.questions[0]).toEqual(expect.objectContaining({
                            replyCount: 0,
                            answeredByFounder: false,
                        }))
                        expect(questionBuilder.andWhere).toHaveBeenCalledWith(expect.stringContaining("NOT EXISTS"))
                        expect(questionBuilder.orderBy).toHaveBeenCalledWith("comment.created_at",
                            "ASC")
                        expect(questionBuilder.skip).toHaveBeenCalledWith(5)
                    })

                it("applies mine/search/answered filters and maps grouped aggregates",
                    async () => {
                        const questionBuilder = makeBuilder()
                        const countBuilder = makeBuilder()
                        const founderBuilder = makeBuilder()
                        questionBuilder.getManyAndCount.mockResolvedValueOnce([
                            [{
                                id: "question-1",
                            }],
                            1,
                        ])
                        countBuilder.getRawMany.mockResolvedValueOnce([{
                            parentId: "question-1",
                            count: "2",
                        }])
                        founderBuilder.getRawMany.mockResolvedValueOnce([{
                            parentId: "question-1",
                        }])
                        entityManager.createQueryBuilder = jest.fn()
                            .mockReturnValueOnce(questionBuilder)
                            .mockReturnValueOnce(countBuilder)
                            .mockReturnValueOnce(founderBuilder)

                        const result = await service.listCourseQuestions({
                            courseId: "course-1",
                            filter: CourseQuestionFilter.Answered,
                            search: "billing",
                            page: 1,
                            limit: 10,
                            userId: author.id,
                        })

                        expect(result.questions[0]).toEqual(expect.objectContaining({
                            replyCount: 2,
                            answeredByFounder: true,
                        }))
                        expect(questionBuilder.andWhere).toHaveBeenCalledWith("comment.body ILIKE :search",
                            {
                                search: "%billing%",
                            })
                        expect(questionBuilder.andWhere).toHaveBeenCalledWith(expect.stringContaining("EXISTS"))

                        const mineBuilder = makeBuilder()
                        mineBuilder.getManyAndCount.mockResolvedValueOnce([
                            [],
                            0,
                        ])
                        entityManager.createQueryBuilder = jest.fn()
                            .mockReturnValueOnce(mineBuilder)
                        await expect(service.listCourseQuestions({
                            courseId: "course-1",
                            filter: CourseQuestionFilter.Mine,
                            page: 1,
                            limit: 10,
                            userId: author.id,
                        })).resolves.toEqual({
                            questions: [],
                            total: 0,
                        })
                        expect(mineBuilder.andWhere).toHaveBeenCalledWith("comment.user_id = :userId",
                            {
                                userId: author.id,
                            })
                    })
            })

        describe("countReplies",
            () => {
                it("returns an empty map for an empty input (no query)",
                    async () => {
                        const result = await service.countReplies([])

                        expect(result).toEqual({
                        })
                        // short-circuits before building a query / empty IN ()
                        expect(entityManager.createQueryBuilder).not.toHaveBeenCalled()
                    })

                it("folds grouped rows into a parent-id → count map",
                    async () => {
                        countQueryBuilder.getRawMany.mockResolvedValueOnce([
                            {
                                parentId: "p1",
                                // raw COUNT comes back as text -> coerced to a number
                                count: "3",
                            },
                            {
                                parentId: "p2",
                                count: "1",
                            },
                        ])

                        const result = await service.countReplies([
                            "p1",
                            "p2",
                        ])

                        expect(result).toEqual({
                            p1: 3,
                            p2: 1,
                        })
                    })
            })
    })
