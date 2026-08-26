import {
    ContentCommentsService
} from "./content-comments.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
describe("ContentCommentsService",
    () => {
        it("rejects unauthenticated viewers",
            async () => {
                const service = new ContentCommentsService({
                } as never,
{
} as never)
                await expect(service.execute({
                    request: {
                        contentId: "c"
                    } as never, user: undefined
                } as never)).rejects.toBeInstanceOf(UserNotFoundException)
            })
        it("maps paginated comments with batch aggregates",
            async () => {
                const comment = {
                    id: "c", body: "body", createdAt: new Date(), user: {
                        username: "u"
                    }
                }
                const domain = {
                    listComments: jest.fn().mockResolvedValue({
                        comments: [comment], total: 1
                    }), countReplies: jest.fn().mockResolvedValue({
                        c: 2
                    })
                }
                const reaction = {
                    summarizeComments: jest.fn().mockResolvedValue({
                    })
                }
                const service = new ContentCommentsService(domain as never,
reaction as never)
                await expect(service.execute({
                    request: {
                        contentId: "content"
                    }, user: {
                        id: "u"
                    }
                } as never)).resolves.toMatchObject({
                    total: 1, comments: [expect.objectContaining({
                        id: "c", replyCount: 2
                    })]
                })
            })
    })
