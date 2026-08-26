import {
    UpdateCommunityPostService
} from "./update-community-post.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn().mockReturnValue({
            community: {
                founderUsername: "founder"
            },
            nats: {
                ping: {
                    interval: 1000,
                },
            },
        })
    }))

describe("UpdateCommunityPostService",
    () => {
        it("rejects an unauthenticated update before ownership delegation",
            async () => {
                const updatePost = jest.fn()
                const service = new UpdateCommunityPostService({
                    updatePost
                } as never,
{
} as never,
{
} as never)
                await expect(service.execute({
                    request: {
                        postId: "p1", body: "new"
                    }, user: undefined
                } as never)).rejects.toBeInstanceOf(UserNotFoundException)
                expect(updatePost).not.toHaveBeenCalled()
            })

        it("refreshes aggregates after an owned edit",
            async () => {
                const post = {
                    id: "p1", body: "edited", isDeleted: false, channel: "general", isPinned: false, authorId: "u1", author: {
                        username: "member"
                    }, createdAt: new Date(), editedAt: new Date()
                }
                const updatePost = jest.fn().mockResolvedValue(post)
                const service = new UpdateCommunityPostService({
                    updatePost
                } as never,
{
    summarizePosts: jest.fn().mockResolvedValue({
    })
} as never,
{
    countCommentsByPosts: jest.fn().mockResolvedValue({
    })
} as never)
                await expect(service.execute({
                    request: {
                        postId: "p1", body: "edited"
                    }, user: {
                        id: "u1"
                    }
                } as never)).resolves.toEqual(expect.objectContaining({
                    id: "p1", body: "edited", commentCount: 0
                }))
                expect(updatePost).toHaveBeenCalledWith({
                    postId: "p1", body: "edited", user: {
                        id: "u1"
                    }
                })
            })
    })
