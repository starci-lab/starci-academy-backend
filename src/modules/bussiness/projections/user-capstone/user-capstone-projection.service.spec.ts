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

        it("maps nested progress values and uses an injected transaction manager",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        updatedAt: new Date(), value: {
                            courses: [{
                                courseId: "course-1", courseTitle: "Course", totalMilestones: "bad",
                                completedMilestones: "2", totalTasks: null, completedTasks: "1", milestones: [{
                                    id: "milestone-1", title: "Milestone", position: "bad", totalTasks: "3",
                                    passedTasks: null, tasks: [{
                                        id: "task-1", title: "Task", position: "1", passed: 1, score: "bad", passedAt: null,
                                    }],
                                }],
                            }],
                        },
                    }),
                    query: jest.fn(),
                }
                const service = new UserCapstoneProjectionService(manager as never)

                await expect(service.getProgress("u")).resolves.toEqual([{
                    courseId: "course-1", courseTitle: "Course", totalMilestones: 0,
                    completedMilestones: 2, totalTasks: 0, completedTasks: 1, milestones: [{
                        id: "milestone-1", title: "Milestone", position: 0, totalTasks: 3,
                        passedTasks: 0, tasks: [{
                            id: "task-1", title: "Task", position: 1, passed: true, score: 0, passedAt: null,
                        }],
                    }],
                }])

                const transactionManager = {
                    query: jest.fn(),
                }
                await service.recompute({
                    userId: "u", entityManager: transactionManager as never,
                })
                expect(transactionManager.query).toHaveBeenCalledWith(
                    expect.stringContaining("user_capstone_projections"),
                    ["u"],
                )
                expect(manager.query).not.toHaveBeenCalled()
            })
    })
