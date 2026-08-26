import {
    ContentEngagementProjectionService
} from "./content-engagement-projection.service"
import {
    ReactionType
} from "@modules/databases/postgresql/primary/enums/reaction-type"

describe("ContentEngagementProjectionService",
    () => {
        const manager = {
            findOne: jest.fn(),
            query: jest.fn().mockResolvedValue(undefined),
        }
        const service = new ContentEngagementProjectionService(manager as never)

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("parses an existing projection row and normalizes counters",
            async () => {
                manager.findOne.mockResolvedValue({
                    updatedAt: new Date(),
                    value: {
                        totalReactions: "3",
                        reactionsByType: {
                            [ReactionType.Like]: 3
                        },
                        viewCount: "8",
                        shareCount: 0,
                        commentCount: "2",
                    },
                })
                await expect(service.getSummary("content-1")).resolves.toMatchObject({
                    totalReactions: 3, viewCount: 8, commentCount: 2
                })
            })

        it("recomputes and returns zero defaults when the row is missing",
            async () => {
                manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
                await expect(service.getSummary("content-1")).resolves.toEqual({
                    totalReactions: 0, reactionsByType: {
                    }, viewCount: 0, shareCount: 0, commentCount: 0,
                })
                expect(manager.query).toHaveBeenCalledWith(expect.stringContaining("ON CONFLICT"),
                    ["content-1"])
            })
    })
