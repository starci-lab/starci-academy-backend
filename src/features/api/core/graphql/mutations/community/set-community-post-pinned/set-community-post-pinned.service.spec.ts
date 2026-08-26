import {
    SetCommunityPostPinnedService
} from "./set-community-post-pinned.service"
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

describe("SetCommunityPostPinnedService",
    () => {
        it("rejects an unauthenticated pin request before delegation",
            async () => {
                const setPinned = jest.fn()
                const service = new SetCommunityPostPinnedService({
                    setPinned
                } as never,
{
} as never,
{
} as never)
                await expect(service.execute({
                    request: {
                        postId: "p1", pinned: true
                    }, user: undefined
                } as never)).rejects.toBeInstanceOf(UserNotFoundException)
                expect(setPinned).not.toHaveBeenCalled()
            })

        it("refreshes aggregates after pinning and maps the returned node",
            async () => {
                const post = {
                    id: "p1", body: "body", isDeleted: false, channel: "general", isPinned: true, authorId: "u1", author: {
                        username: "founder"
                    }, createdAt: new Date(), editedAt: null
                }
                const setPinned = jest.fn().mockResolvedValue(post)
                const summarizePosts = jest.fn().mockResolvedValue({
                })
                const countCommentsByPosts = jest.fn().mockResolvedValue({
                })
                const service = new SetCommunityPostPinnedService({
                    setPinned
                } as never,
{
    summarizePosts
} as never,
{
    countCommentsByPosts
} as never)
                const result = await service.execute({
                    request: {
                        postId: "p1", pinned: true
                    }, user: {
                        id: "u1"
                    }
                } as never)
                expect(result).toEqual(expect.objectContaining({
                    id: "p1", commentCount: 0, isMine: true, isFounderAuthor: true
                }))
                expect(summarizePosts).toHaveBeenCalledWith({
                    postIds: ["p1"], userId: "u1"
                })
                expect(countCommentsByPosts).toHaveBeenCalledWith(["p1"])
            })
    })
