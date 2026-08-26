import {
    CommunityPostQueryService
} from "./community-post.service"

describe("CommunityPostQueryService",
    () => {
        it("propagates a missing-post error without querying aggregates",
            async () => {
                const error = new Error("missing")
                const summarizePosts = jest.fn()
                const service = new CommunityPostQueryService({
                    getPostOrThrow: jest.fn().mockRejectedValue(error)
                } as never,
{
    summarizePosts
} as never,
{
    countCommentsByPosts: jest.fn()
} as never)
                await expect(service.execute({
                    request: {
                        postId: "p1"
                    }, user: undefined
                } as never)).rejects.toBe(error)
                expect(summarizePosts).not.toHaveBeenCalled()
            })
    })
