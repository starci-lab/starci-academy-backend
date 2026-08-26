import {
    CommunityPostCommentsService
} from "./community-post-comments.service"
describe("CommunityPostCommentsService",
    () => {
        it("maps aggregate defaults and supports anonymous viewers",
            async () => {
                const comment = {
                    id: "c", body: "body", createdAt: new Date(), user: {
                        username: "u"
                    }
                }
                const comments = {
                    listComments: jest.fn().mockResolvedValue({
                        comments: [comment], total: 1
                    }), countReplies: jest.fn().mockResolvedValue({
                    })
                }
                const reactions = {
                    summarizeComments: jest.fn().mockResolvedValue({
                    })
                }
                const service = new CommunityPostCommentsService(comments as never,
reactions as never)
                await expect(service.execute({
                    request: {
                        postId: "p"
                    }, user: undefined
                } as never)).resolves.toMatchObject({
                    total: 1, comments: [expect.objectContaining({
                        id: "c", replyCount: 0
                    })]
                })
                expect(reactions.summarizeComments).toHaveBeenCalledWith(expect.objectContaining({
                    userId: ""
                }))
            })
    })
