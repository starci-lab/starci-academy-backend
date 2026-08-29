import {
    UserCoursesResolver,
} from "./user-courses.resolver"

describe("UserCoursesResolver",
    () => {
        it("returns the canonical public path with the course progress payload",
            async () => {
                const progressProjectionService = {
                    getMyCourseProgress: jest.fn().mockResolvedValue([
                        {
                            courseId: "course-1",
                            path: "/courses/fullstack-mastery",
                            title: "Fullstack Mastery",
                            thumbnailUrl: null,
                            contentCompleted: 2,
                            contentTotal: 10,
                            challengeCompleted: 1,
                            challengeTotal: 5,
                            completed: 0,
                            total: 2,
                            isEnrolled: true,
                        },
                    ]),
                }
                const resolver = new UserCoursesResolver(progressProjectionService as never)

                await expect(resolver.execute("profile-user")).resolves.toEqual([
                    expect.objectContaining({
                        path: "/courses/fullstack-mastery",
                        label: "Fullstack Mastery",
                        completionPercent: expect.any(Number),
                    }),
                ])
                expect(progressProjectionService.getMyCourseProgress).toHaveBeenCalledWith("profile-user")
            })
    })
