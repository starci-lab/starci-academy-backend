import {
    CommunityFeedService
} from "./community-feed.service"

describe("CommunityFeedService",
    () => {
        it("clamps limit, defaults unauthenticated viewer, and emits a next cursor",
            async () => {
                const posts = [{
                    id: "p1", authorId: "a", author: {
                        username: "author"
                    }, isDeleted: false, body: "body", channel: "general", isPinned: false, editedAt: null, createdAt: new Date()
                }]
                const postService = {
                    listFeed: jest.fn().mockResolvedValue({
                        posts, total: 100
                    })
                }
                const reactionService = {
                    summarizePosts: jest.fn().mockResolvedValue({
                    })
                }
                const commentService = {
                    countCommentsByPosts: jest.fn().mockResolvedValue({
                    })
                }
                const service = new CommunityFeedService(postService as never,
reactionService as never,
commentService as never)
                const result = await service.execute({
                    request: {
                        limit: 999, channel: undefined, cursor: undefined
                    }, user: undefined
                } as never)
                expect(postService.listFeed).toHaveBeenCalledWith({
                    channel: null, offset: 0, limit: 50
                })
                expect(reactionService.summarizePosts).toHaveBeenCalledWith({
                    postIds: ["p1"], userId: ""
                })
                expect(result.items).toHaveLength(1)
                expect(result.nextCursor).toBeTruthy()
            })
        it("treats malformed and negative cursors as the first page",
            async () => {
                const postService = {
                    listFeed: jest.fn().mockResolvedValue({
                        posts: [], total: 0
                    })
                }
                const service = new CommunityFeedService(postService as never,
{
    summarizePosts: jest.fn().mockResolvedValue({
    })
} as never,
{
    countCommentsByPosts: jest.fn().mockResolvedValue({
    })
} as never)
                await service.execute({
                    request: {
                        limit: 20, cursor: "not-json"
                    }
                } as never)
                await service.execute({
                    request: {
                        limit: 20, cursor: Buffer.from(JSON.stringify({
                            offset: -1
                        })).toString("base64url")
                    }
                } as never)
                expect(postService.listFeed).toHaveBeenNthCalledWith(1,
                    {
                        channel: null, offset: 0, limit: 20
                    })
                expect(postService.listFeed).toHaveBeenNthCalledWith(2,
                    {
                        channel: null, offset: 0, limit: 20
                    })
            })
    })
