import {
    TrendingContentsProjectionService
} from "./trending-contents-projection.service"

describe("TrendingContentsProjectionService",
    () => {
        it("excludes viewer-read items and limits the board",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        updatedAt: new Date(), value: {
                            items: [{
                                id: "a", title: "A", readCount: "3"
                            },
                            {
                                id: "b", title: "B", readCount: 2
                            }]
                        }
                    }), query: jest.fn().mockResolvedValue([{
                        content_id: "a"
                    }])
                }
                await expect(new TrendingContentsProjectionService(manager as never).getTrending({
                    viewerId: "u", limit: 1
                })).resolves.toEqual([{
                    id: "b", title: "B", readCount: 2
                }])
            })
        it("returns empty when no materialized row exists",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null), query: jest.fn()
                }
                await expect(new TrendingContentsProjectionService(manager as never).getTrending({
                    viewerId: "u", limit: 5
                })).resolves.toEqual([])
                expect(manager.query).toHaveBeenCalled()
            })
    })
