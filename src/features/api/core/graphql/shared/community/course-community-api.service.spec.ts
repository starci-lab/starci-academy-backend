import { CourseCommunityApiService } from "./course-community-api.service"

describe("CourseCommunityApiService projections", () => {
    it("batch maps authoritative post aggregates and viewer ownership", async () => {
        const community = { aggregatePosts: jest.fn().mockResolvedValue({ comments: { p1: 3 }, reactions: { p1: { counts: [], total: 1, myReaction: "like", viewCount: 0, shareCount: 0 } } }) }
        const service = new CourseCommunityApiService({} as never, {} as never, community as never)
        const nodes = await service.postNodes("course-a", [{ id: "p1", body: "body", isDeleted: false, editedAt: null, createdAt: new Date(0), authorId: "viewer", author: { id: "viewer" } }] as never, "viewer")
        expect(community.aggregatePosts).toHaveBeenCalledTimes(1)
        expect(nodes[0]).toMatchObject({ id: "p1", commentCount: 3, isMine: true, reactions: { total: 1, myReaction: "like" } })
        expect(nodes[0]).not.toHaveProperty("channel")
        expect(nodes[0]).not.toHaveProperty("isFounderAuthor")
    })
    it("batch maps comment aggregates, author and ownership", async () => {
        const community = { aggregateComments: jest.fn().mockResolvedValue({ replies: { c1: 2 }, reactions: { c1: { counts: [], total: 0, myReaction: null, viewCount: 0, shareCount: 0 } } }) }
        const service = new CourseCommunityApiService({} as never, {} as never, community as never)
        const nodes = await service.commentNodes("course-a", [{ id: "c1", body: "body", isDeleted: false, editedAt: null, createdAt: new Date(0), parentCommentId: null, userId: "viewer", user: { id: "viewer" } }] as never, "viewer")
        expect(community.aggregateComments).toHaveBeenCalledTimes(1)
        expect(nodes[0]).toMatchObject({ id: "c1", replyCount: 2, isMine: true, author: { id: "viewer" } })
    })
})
