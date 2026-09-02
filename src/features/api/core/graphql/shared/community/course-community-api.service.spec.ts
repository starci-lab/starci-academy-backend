import {
    CourseCommunityApiService
} from "./course-community-api.service"
import {
    CourseCommunityUnavailableException
} from "@modules/platform/exceptions/errors/community/course-community"

describe("CourseCommunityApiService projections",
    () => {
        it("authorizes course community through the centralized effective-access decision",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        id: "course-a",
                    }),
                }
                const access = {
                    hasCourseAccess: jest.fn().mockResolvedValue(true),
                }
                const service = new CourseCommunityApiService(
      manager as never,
      access as never,
      {
      } as never,
                )

                await expect(
                    service.authorize("course-display",
{
    id: "user-1",
} as never),
                ).resolves.toBe("course-a")
                expect(access.hasCourseAccess).toHaveBeenCalledWith("user-1",
                    "course-a")
            })

        it("rejects course community when effective access is denied",
            async () => {
                const service = new CourseCommunityApiService(
      {
          findOne: jest.fn().mockResolvedValue({
              id: "course-a",
          }),
      } as never,
      {
          hasCourseAccess: jest.fn().mockResolvedValue(false),
      } as never,
      {
      } as never,
                )

                await expect(
                    service.authorize("course-display",
{
    id: "user-1",
} as never),
                ).rejects.toBeInstanceOf(CourseCommunityUnavailableException)
            })

        it("batch maps authoritative post aggregates and viewer ownership",
            async () => {
                const community = {
                    aggregatePosts: jest.fn().mockResolvedValue({
                        comments: {
                            p1: 3,
                        },
                        reactions: {
                            p1: {
                                counts: [],
                                total: 1,
                                myReaction: "like",
                                viewCount: 0,
                                shareCount: 0,
                            },
                        },
                    }),
                }
                const service = new CourseCommunityApiService(
      {
      } as never,
      {
      } as never,
      community as never,
                )
                const nodes = await service.postNodes(
                    "course-a",
      [
          {
              id: "p1",
              body: "body",
              isDeleted: false,
              editedAt: null,
              createdAt: new Date(0),
              authorId: "viewer",
              author: {
                  id: "viewer",
              },
          },
      ] as never,
      "viewer",
                )
                expect(community.aggregatePosts).toHaveBeenCalledTimes(1)
                expect(nodes[0]).toMatchObject({
                    id: "p1",
                    commentCount: 3,
                    isMine: true,
                    reactions: {
                        total: 1,
                        myReaction: "like",
                    },
                })
                expect(nodes[0]).not.toHaveProperty("channel")
                expect(nodes[0]).not.toHaveProperty("isFounderAuthor")
            })
        it("batch maps comment aggregates, author and ownership",
            async () => {
                const community = {
                    aggregateComments: jest.fn().mockResolvedValue({
                        replies: {
                            c1: 2,
                        },
                        reactions: {
                            c1: {
                                counts: [],
                                total: 0,
                                myReaction: null,
                                viewCount: 0,
                                shareCount: 0,
                            },
                        },
                    }),
                }
                const service = new CourseCommunityApiService(
      {
      } as never,
      {
      } as never,
      community as never,
                )
                const nodes = await service.commentNodes(
                    "course-a",
      [
          {
              id: "c1",
              body: "body",
              isDeleted: false,
              editedAt: null,
              createdAt: new Date(0),
              parentCommentId: null,
              userId: "viewer",
              user: {
                  id: "viewer",
              },
          },
      ] as never,
      "viewer",
                )
                expect(community.aggregateComments).toHaveBeenCalledTimes(1)
                expect(nodes[0]).toMatchObject({
                    id: "c1",
                    replyCount: 2,
                    isMine: true,
                    author: {
                        id: "viewer",
                    },
                })
            })
    })
