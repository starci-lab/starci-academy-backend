import "@modules/bussiness/bussiness.module"
import {
    CvEvidenceService,
} from "@modules/bussiness/cv-evidence/cv-evidence.service"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    MyPickableCvAchievementsHandler,
} from "./my-pickable-cv-achievements.handler"
import {
    MyPickableCvAchievementsQuery,
} from "./my-pickable-cv-achievements.query"

describe("MyPickableCvAchievementsHandler",
    () => {
        const listPickable = jest.fn()
        const handler = new MyPickableCvAchievementsHandler({
            listPickable,
        } as unknown as CvEvidenceService)

        beforeEach(() => jest.clearAllMocks())

        it("returns empty without reading evidence when unauthenticated",
            async () => {
                await expect(handler.execute(new MyPickableCvAchievementsQuery({
                    request: {
                    },
                    user: undefined,
                }))).resolves.toEqual({
                    milestoneTaskAttempts: [] 
                })
                expect(listPickable).not.toHaveBeenCalled()
            })

        it("maps only the authoritative service result including course identity",
            async () => {
                listPickable.mockResolvedValueOnce([{
                    milestoneTaskAttemptId: "attempt-1",
                    milestoneTaskId: "task-1",
                    milestoneId: "milestone-1",
                    courseId: "course-1",
                    taskTitle: "Build an API",
                    milestoneTitle: "Backend capstone",
                    courseTitle: "Fullstack Master",
                    score: 92,
                    passedAt: "2026-08-01T00:00:00.000Z",
                }])

                const result = await handler.execute(new MyPickableCvAchievementsQuery({
                    request: {
                    },
                    user: {
                        id: "user-1" 
                    } as UserEntity,
                }))

                expect(listPickable).toHaveBeenCalledWith({
                    userId: "user-1" 
                })
                expect(result.milestoneTaskAttempts).toEqual([{
                    id: "attempt-1",
                    courseId: "course-1",
                    taskTitle: "Build an API",
                    milestoneTitle: "Backend capstone",
                    courseTitle: "Fullstack Master",
                    score: 92,
                }])
            })
    })
