import {
    EffectiveLearnerAccessService,
} from "./effective-learner-access.service"
import {
    FindOperator,
} from "typeorm"

interface CreateServiceParams {
    proActive: boolean
    enrollment: object | null
}

describe("EffectiveLearnerAccessService course access",
    () => {
        const createService = ({
            proActive,
            enrollment,
        }: CreateServiceParams) => {
            const entityManager = {
                find: jest.fn().mockResolvedValue(enrollment
                    ? [{
                        courseId: "course-1",
                        ...enrollment,
                    }]
                    : []),
                findOne: jest.fn().mockResolvedValue(null),
            }
            const proSubscriptionService = {
                isActive: jest.fn().mockResolvedValue(proActive),
            }
            return {
                service: new EffectiveLearnerAccessService(
                    entityManager as never,
                    {
                    } as never,
                    proSubscriptionService as never,
                ),
                entityManager,
                proSubscriptionService,
            }
        }

        it("allows an active Pro learner without creating or claiming enrollment",
            async () => {
                const { service,
                    entityManager } = createService({
                    proActive: true,
                    enrollment: null,
                })

                await expect(service.resolveCourseAccess("user-1",
                    "course-1")).resolves.toEqual({
                    allowed: true,
                    proActive: true,
                    enrolled: false,
                    source: "pro",
                })
                expect(entityManager.find).toHaveBeenCalledWith(expect.any(Function),
                    expect.objectContaining({
                        where: {
                            user: {
                                id: "user-1",
                            },
                            course: {
                                id: expect.any(FindOperator),
                            },
                            isEnrolled: true,
                        },
                    }))
                const [, options] = entityManager.find.mock.calls[0]
                expect(options.where.course.id.value).toEqual(["course-1"])
                expect(entityManager).not.toHaveProperty("save")
            })

        it("resolves a course page with one Pro read and one enrollment read",
            async () => {
                const { service,
                    entityManager,
                    proSubscriptionService } = createService({
                    proActive: false,
                    enrollment: {
                        courseId: "course-1",
                    },
                })

                await expect(service.resolveCourseAccesses("user-1",
                    ["course-1",
                        "course-2",
                        "course-1"])).resolves.toEqual(new Map([
                    ["course-1",
                        {
                            allowed: true,
                            proActive: false,
                            enrolled: true,
                            source: "legacy-enrollment",
                        }],
                    ["course-2",
                        {
                            allowed: false,
                            proActive: false,
                            enrolled: false,
                            source: "none",
                        }],
                ]))
                expect(proSubscriptionService.isActive).toHaveBeenCalledTimes(1)
                expect(entityManager.find).toHaveBeenCalledTimes(1)
            })

        it("keeps a factual legacy enrollment as an allowed access source",
            async () => {
                const { service } = createService({
                    proActive: false,
                    enrollment: {
                        id: "enrollment-1",
                    },
                })

                await expect(service.resolveCourseAccess("user-1",
                    "course-1")).resolves.toEqual({
                    allowed: true,
                    proActive: false,
                    enrolled: true,
                    source: "legacy-enrollment",
                })
            })

        it("denies a learner with neither active Pro nor factual enrollment",
            async () => {
                const { service } = createService({
                    proActive: false,
                    enrollment: null,
                })

                await expect(service.hasCourseAccess("user-1",
                    "course-1")).resolves.toBe(false)
            })
    })
