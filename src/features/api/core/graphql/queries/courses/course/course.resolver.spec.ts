import {
    CourseResolver
} from "./course.resolver"
import {
    PricingPhase
} from "@modules/databases/postgresql/primary/enums/pricing-phase"

describe("CourseResolver",
    () => {
        it("falls back to early bird, reads enrollment stats, and delegates course lookup",
            async () => {
                const stats = {
                    getStats: jest.fn().mockResolvedValue({
                        enrollmentCount: 12
                    })
                }
                const service = {
                    execute: jest.fn().mockResolvedValue({
                        id: "c1"
                    })
                }
                const userService = {
                    checkEnrollment: jest.fn().mockResolvedValue(true),
                }
                const resolver = new CourseResolver(stats as never,
	service as never,
	userService as never,
	{
	    resolveCourseAccess: jest.fn().mockResolvedValue({
	        allowed: true,
	        enrolled: true,
	        proActive: false,
	        source: "legacy-enrollment",
	    }),
	} as never)
                expect(resolver.currentPhase({
                    metadata: {
                    }
                } as never)).toBe(PricingPhase.EarlyBird)
                await expect(resolver.enrollmentCount({
                    id: "c1"
                } as never)).resolves.toBe(12)
                await expect(resolver.execute({
                    id: "u1",
                } as never,
                {
                    id: "c1"
                } as never,
"en" as never)).resolves.toEqual({
	                    id: "c1",
	                    isEnrolled: true,
	                    hasAccess: true,
	                })
                expect(service.execute).toHaveBeenCalledWith({
                    request: {
                        id: "c1"
                    }, locale: "en"
                })
                expect(userService.checkEnrollment).toHaveBeenCalledWith("u1",
                    "c1")
            })

        it("returns the explicitly seeded current pricing phase",
            () => {
                const resolver = new CourseResolver({
                } as never,
                {
                } as never,
	                {
	                } as never,
	                {
	                } as never)

                expect(resolver.currentPhase({
                    metadata: {
                        currentPhase: PricingPhase.Regular,
                    },
                } as never)).toBe(PricingPhase.Regular)
            })

        it("returns the projection count when the projection has no enrollments",
            async () => {
                const getStats = jest.fn().mockResolvedValue({
                    enrollmentCount: 0,
                })
                const resolver = new CourseResolver({
                    getStats,
                } as never,
                {
                } as never,
	                {
	                } as never,
	                {
	                } as never)

                await expect(resolver.enrollmentCount({
                    id: "course-without-enrollments",
                } as never)).resolves.toBe(0)
                expect(getStats).toHaveBeenCalledWith("course-without-enrollments")
            })

        it("returns null enrollment state for an anonymous viewer without reading enrollments",
            async () => {
                const userService = {
                    checkEnrollment: jest.fn(),
                }
                const resolver = new CourseResolver({
                } as never,
                {
                    execute: jest.fn().mockResolvedValue({
                        id: "c1",
                    }),
                } as never,
	                userService as never,
	                {
	                } as never)

                await expect(resolver.execute(null as never,
                    {
                        displayId: "course",
                    } as never,
                    "en" as never)).resolves.toEqual({
	                    id: "c1",
	                    isEnrolled: null,
	                    hasAccess: null,
	                })
                expect(userService.checkEnrollment).not.toHaveBeenCalled()
            })

        it("returns false when the viewer has no paid enrollment",
            async () => {
                const resolver = new CourseResolver({
                } as never,
                {
                    execute: jest.fn().mockResolvedValue({
                        id: "c1",
                    }),
                } as never,
	                {
	                    checkEnrollment: jest.fn().mockResolvedValue(false),
	                } as never,
	                {
	                    resolveCourseAccess: jest.fn().mockResolvedValue({
	                        allowed: true,
	                        enrolled: false,
	                        proActive: true,
	                        source: "pro",
	                    }),
	                } as never)

                await expect(resolver.execute({
                    id: "u1",
                } as never,
                {
                    displayId: "course",
                } as never,
                "vi" as never)).resolves.toEqual({
	                    id: "c1",
	                    isEnrolled: false,
	                    hasAccess: true,
	                })
            })
    })
