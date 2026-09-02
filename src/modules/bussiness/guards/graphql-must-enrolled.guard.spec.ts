import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    CourseIdRequiredException,
} from "@modules/platform/exceptions/errors/guards/course-id-required"
import {
    EnrollmentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/enrollment-not-found"
import {
    GraphQLMustEnrolledGuard,
} from "./graphql-must-enrolled.guard"

describe("GraphQLMustEnrolledGuard effective paid access",
    () => {
        const contextFor = (courseId?: string) => {
            jest.spyOn(GqlExecutionContext,
                "create").mockReturnValue({
                    getContext: () => ({
                        req: {
                            user: {
                                id: "user-1",
                            },
                            headers: courseId
                                ? {
                                    "x-course-id": courseId,
                                }
                                : {
                                },
                        },
                    }),
                } as never)
            return {
            } as never
        }

        afterEach(() => {
            jest.restoreAllMocks()
        })

        it("allows the mock-interview guard path when effective access is granted",
            async () => {
                const hasCourseAccess = jest.fn().mockResolvedValue(true)
                const guard = new GraphQLMustEnrolledGuard({
                    hasCourseAccess,
                } as never)

                await expect(guard.canActivate(contextFor("course-1"))).resolves.toBe(true)
                expect(hasCourseAccess).toHaveBeenCalledWith("user-1",
                    "course-1")
            })

        it("denies when neither active Pro nor factual enrollment grants access",
            async () => {
                const guard = new GraphQLMustEnrolledGuard({
                    hasCourseAccess: jest.fn().mockResolvedValue(false),
                } as never)

                await expect(guard.canActivate(contextFor("course-1")))
                    .rejects.toBeInstanceOf(EnrollmentNotFoundException)
            })

        it("still rejects a request without course identity",
            async () => {
                const hasCourseAccess = jest.fn()
                const guard = new GraphQLMustEnrolledGuard({
                    hasCourseAccess,
                } as never)

                await expect(guard.canActivate(contextFor()))
                    .rejects.toBeInstanceOf(CourseIdRequiredException)
                expect(hasCourseAccess).not.toHaveBeenCalled()
            })
    })
