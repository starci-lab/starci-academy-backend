import {
    toGlobalId
} from "@modules/platform/routing/utils/global-id"
import {
    CourseEntity
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    MilestoneEntity
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    MilestoneTaskEntity
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    UserCapstoneProgressResolver
} from "./user-capstone-progress.resolver"

describe("UserCapstoneProgressResolver",
    () => {
        it("maps the projection aggregate to opaque ids while preserving progress",
            async () => {
                const getProgress = jest.fn().mockResolvedValue([
                    {
                        courseId: "course-1",
                        courseTitle: "Backend",
                        totalMilestones: 1,
                        completedMilestones: 0,
                        totalTasks: 1,
                        completedTasks: 0,
                        milestones: [
                            {
                                id: "milestone-1",
                                title: "HTTP",
                                position: 2,
                                totalTasks: 1,
                                passedTasks: 0,
                                tasks: [
                                    {
                                        id: "task-1",
                                        title: "REST",
                                        passed: false,
                                        score: 0,
                                        passedAt: null,
                                    },
                                ],
                            },
                        ],
                    },
                ])
                const resolver = new UserCapstoneProgressResolver({
                    getProgress
                } as never)

                await expect(resolver.execute("user-1")).resolves.toEqual([
                    {
                        courseGlobalId: toGlobalId(CourseEntity.name,
                            "course-1"),
                        courseTitle: "Backend",
                        totalMilestones: 1,
                        completedMilestones: 0,
                        totalTasks: 1,
                        completedTasks: 0,
                        milestones: [
                            {
                                milestoneGlobalId: toGlobalId(MilestoneEntity.name,
                                    "milestone-1"),
                                title: "HTTP",
                                position: 2,
                                totalTasks: 1,
                                passedTasks: 0,
                                tasks: [
                                    {
                                        taskGlobalId: toGlobalId(MilestoneTaskEntity.name,
                                            "task-1"),
                                        title: "REST",
                                        passed: false,
                                        score: 0,
                                        passedAt: null,
                                    },
                                ],
                            },
                        ],
                    },
                ])
                expect(getProgress).toHaveBeenCalledWith("user-1")
            })

        it("returns an empty list and propagates projection failures",
            async () => {
                const getProgress = jest.fn().mockResolvedValue([])
                const resolver = new UserCapstoneProgressResolver({
                    getProgress
                } as never)
                await expect(resolver.execute("user-empty")).resolves.toEqual([])

                const failure = new Error("projection unavailable")
                getProgress.mockRejectedValueOnce(failure)
                await expect(resolver.execute("user-1")).rejects.toBe(failure)
            })
    })
