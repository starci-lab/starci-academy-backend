import {
    UserPinnedProjectsProjectionService
} from "./user-pinned-projects-projection.service"

describe("UserPinnedProjectsProjectionService",
    () => {
        const manager = {
            findOne: jest.fn(), query: jest.fn().mockResolvedValue(undefined)
        }
        const service = new UserPinnedProjectsProjectionService(manager as never)
        beforeEach(() => jest.clearAllMocks())

        it("maps optional pin fields and numeric order values",
            async () => {
                manager.findOne.mockResolvedValue({
                    updatedAt: new Date(), value: {
                        pins: [{
                            id: "p1", type: "external", orderIndex: "4", isVerified: 1
                        }]
                    }
                })
                await expect(service.getByUser("user-1")).resolves.toEqual([{
                    id: "p1", type: "external", title: null, description: null, url: null, techStack: null, isVerified: true, orderIndex: 4
                }])
            })

        it("recomputes missing rows and returns an empty list",
            async () => {
                manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
                await expect(service.getByUser("user-1")).resolves.toEqual([])
                expect(manager.query).toHaveBeenCalledWith(expect.stringContaining("ON CONFLICT"),
                    ["user-1"])
            })
    })
