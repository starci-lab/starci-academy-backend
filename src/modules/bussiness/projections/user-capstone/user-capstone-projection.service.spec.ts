import {
    UserCapstoneProjectionService
} from "./user-capstone-projection.service"

describe("UserCapstoneProjectionService",
    () => {
        it("maps stored task values and converts numeric/date fields",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        updatedAt: new Date(), value: {
                            tasks: [{
                                courseId: "c", courseTitle: "Course", milestoneTitle: "M", taskTitle: "T", score: "8", passedAt: "2026-01-01T00:00:00.000Z"
                            }]
                        }
                    }), query: jest.fn()
                }
                const service = new UserCapstoneProjectionService(manager as never)
                await expect(service.getTasks("u")).resolves.toEqual([expect.objectContaining({
                    score: 8, passedAt: new Date("2026-01-01T00:00:00.000Z")
                })])
            })
        it("returns empty progress after recompute when no row exists",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null), query: jest.fn()
                }
                await expect(new UserCapstoneProjectionService(manager as never).getProgress("u")).resolves.toEqual([])
                expect(manager.query).toHaveBeenCalled()
            })
        it("recomputes stale rows and maps empty/default task values",
            async () => {
                const manager = {
                    findOne: jest.fn()
                        .mockResolvedValueOnce({
                            updatedAt: new Date("2020-01-01"), value: {
                                tasks: []
                            }
                        })
                        .mockResolvedValueOnce({
                            updatedAt: new Date(), value: {
                                tasks: [{
                                    courseId: "c", courseTitle: "Course", milestoneTitle: "M", taskTitle: "T", score: "bad", passedAt: null,
                                }]
                            }
                        }),
                    query: jest.fn(),
                }
                const service = new UserCapstoneProjectionService(manager as never)

                await expect(service.getTasks("u")).resolves.toEqual([expect.objectContaining({
                    score: 0, passedAt: null
                })])
                expect(manager.query).toHaveBeenCalledTimes(1)
            })
    })
