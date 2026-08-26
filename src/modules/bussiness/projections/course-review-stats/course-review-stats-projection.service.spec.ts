import {
    CourseReviewStatsProjectionService
} from "./course-review-stats-projection.service"

describe("CourseReviewStatsProjectionService",
    () => {
        const manager = {
            findOne: jest.fn(), query: jest.fn().mockResolvedValue(undefined)
        }
        const service = new CourseReviewStatsProjectionService(manager as never)
        beforeEach(() => jest.clearAllMocks())

        it("parses a populated review aggregate",
            async () => {
                manager.findOne.mockResolvedValue({
                    updatedAt: new Date(), value: {
                        averageScore: "4.5", reviewCount: "2", scoreHistogram: {
                            "5": 1
                        }
                    }
                })
                await expect(service.getStats("course-1")).resolves.toEqual({
                    averageScore: 4.5, reviewCount: 2, scoreHistogram: {
                        "5": 1
                    }
                })
            })

        it("heals an absent aggregate and returns zero defaults",
            async () => {
                manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
                await expect(service.getStats("course-1")).resolves.toEqual({
                    averageScore: 0, reviewCount: 0, scoreHistogram: {
                    }
                })
                expect(manager.query).toHaveBeenCalledWith(expect.stringContaining("ON CONFLICT"),
                    ["course-1"])
            })
    })
