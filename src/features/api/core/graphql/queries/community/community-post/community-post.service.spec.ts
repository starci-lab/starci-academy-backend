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

        it("uses defensive aggregate defaults for an anonymous post query",
            async () => {
                const post = {
                    id: "p1",
                    body: "hello",
                    isDeleted: false,
                    channel: "general",
                    isPinned: false,
                    editedAt: null,
                    createdAt: new Date(0),
                    authorId: "author-1",
                    author: {
                        username: "learner",
                    },
                }
                const service = new CommunityPostQueryService({
                    getPostOrThrow: jest.fn().mockResolvedValue(post),
                } as never,
                {
                    summarizePosts: jest.fn().mockResolvedValue({
                    }),
                } as never,
                {
                    countCommentsByPosts: jest.fn().mockResolvedValue({
                    }),
                } as never)

                const result = await service.execute({
                    request: {
                        postId: "p1",
                    },
                    user: undefined,
                } as never)

                expect(result).toEqual(expect.objectContaining({
                    id: "p1",
                    commentCount: 0,
                    isMine: false,
                    reactions: expect.objectContaining({
                        counts: [],
                        total: 0,
                        myReaction: null,
                    }),
                }))
            })

        it("passes an authenticated viewer id and loaded aggregates to the node mapper",
            async () => {
                const post = {
                    id: "p2",
                    body: "hello",
                    isDeleted: true,
                    channel: "general",
                    isPinned: true,
                    editedAt: null,
                    createdAt: new Date(0),
                    authorId: "user-2",
                    author: {
                        username: "learner",
                    },
                }
                const reactions = {
                    counts: [
                        {
                            reaction: "like",
                            count: 1,
                        },
                    ],
                    total: 1,
                    myReaction: "like",
                    viewCount: 2,
                    shareCount: 3,
                }
                const service = new CommunityPostQueryService({
                    getPostOrThrow: jest.fn().mockResolvedValue(post),
                } as never,
                {
                    summarizePosts: jest.fn().mockResolvedValue({
                        "p2": reactions,
                    }),
                } as never,
                {
                    countCommentsByPosts: jest.fn().mockResolvedValue({
                        "p2": 4,
                    }),
                } as never)

                const result = await service.execute({
                    request: {
                        postId: "p2",
                    },
                    user: {
                        id: "user-2",
                    },
                } as never)

                expect(result).toEqual(expect.objectContaining({
                    id: "p2",
                    body: "",
                    commentCount: 4,
                    isMine: true,
                    reactions,
                }))
            })
    })
