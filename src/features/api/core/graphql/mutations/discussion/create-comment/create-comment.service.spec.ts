import {
    CreateCommentService
} from "./create-comment.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    writeActivity,
} from "@modules/bussiness/activity/write-activity"

jest.mock("@modules/bussiness/activity/write-activity",
    () => ({
        writeActivity: jest.fn().mockResolvedValue(undefined),
    }))

describe("CreateCommentService",
    () => {
        it("rejects an absent authenticated user before writing",
            async () => {
                const service = new CreateCommentService({
                    createComment: jest.fn()
                } as never,
{
    findOne: jest.fn()
} as never)
                await expect(service.execute({
                    request: {
                        body: "hello"
                    } as never, user: undefined
                } as never)).rejects.toBeInstanceOf(UserNotFoundException)
            })

        it("creates a content comment, records its activity, and maps its author",
            async () => {
                const commentService = {
                    createComment: jest.fn().mockResolvedValue({
                        id: "comment-1",
                        contentId: "content-1",
                        body: "hello",
                        isDeleted: false,
                        editedAt: null,
                        createdAt: new Date("2026-08-26T00:00:00.000Z"),
                        parentCommentId: null,
                        user: {
                            id: "user-1",
                            username: "learner",
                        },
                    }),
                }
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue({
                        id: "content-1",
                        title: "Intro",
                    }),
                }
                const service = new CreateCommentService(
                    commentService as never,
                    entityManager as never,
                )

                const result = await service.execute({
                    request: {
                        contentId: "content-1",
                        courseId: undefined,
                        parentCommentId: undefined,
                        body: "hello",
                    },
                    user: {
                        id: "user-1",
                    },
                } as never)

                expect(result).toEqual(expect.objectContaining({
                    id: "comment-1",
                    body: "hello",
                    replyCount: 0,
                    isFounderAuthor: false,
                }))
                expect(commentService.createComment).toHaveBeenCalledWith(expect.objectContaining({
                    contentId: "content-1",
                    body: "hello",
                }))
                expect(writeActivity).toHaveBeenCalledWith(expect.objectContaining({
                    userId: "user-1",
                    idempotencyKey: "comment-1",
                    metadata: {
                        target: {
                            entityName: "ContentEntity",
                            id: "content-1",
                            label: "Intro",
                        },
                    },
                }))
            })

        it("uses the course target and an empty label when a course title is unavailable",
            async () => {
                const commentService = {
                    createComment: jest.fn().mockResolvedValue({
                        id: "comment-2",
                        courseId: "course-1",
                        body: "course comment",
                        isDeleted: true,
                        editedAt: null,
                        createdAt: new Date("2026-08-26T00:00:00.000Z"),
                        parentCommentId: null,
                        user: {
                            id: "user-2",
                            username: "learner",
                        },
                    }),
                }
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(null),
                }
                const service = new CreateCommentService(
                    commentService as never,
                    entityManager as never,
                )

                const result = await service.execute({
                    request: {
                        courseId: "course-1",
                        body: "course comment",
                    },
                    user: {
                        id: "user-2",
                    },
                } as never)

                expect(result.body).toBe("")
                expect(result.isDeleted).toBe(true)
                expect(entityManager.findOne).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        where: {
                            id: "course-1",
                        },
                    }))
                expect(writeActivity).toHaveBeenCalledWith(expect.objectContaining({
                    idempotencyKey: "comment-2",
                    metadata: {
                        target: expect.objectContaining({
                            id: "course-1",
                            label: "",
                        }),
                    },
                }))
            })
    })
