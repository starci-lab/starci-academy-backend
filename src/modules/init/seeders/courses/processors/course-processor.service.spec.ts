import {
    CourseProcessorService
} from "./course-processor.service"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    getAppConfig,
} from "@modules/filesystem/utils/mount-secrets"
jest.mock("@modules/filesystem/utils/mount-secrets",
    () => ({
        getAppConfig: jest.fn().mockReturnValue({
        })
    }))
describe("CourseProcessorService",
    () => { it("skips nested processors when a course is deleted by reconciliation",
        async () => { const course = {
            id: "c1", displayId: "course"
        }; const service = new CourseProcessorService({
            findOne: jest.fn().mockResolvedValue(null)
        } as never,
{
    partitionUuidSync: jest.fn().mockResolvedValue({
        createEntities: [], updateEntities: [], deleteEntities: [{
            id: "c1"
        }]
    })
} as never,
{
    process: jest.fn()
} as never,
{
    process: jest.fn()
} as never,
{
    process: jest.fn()
} as never,
{
    process: jest.fn()
} as never,
{
    process: jest.fn()
} as never,
{
    process: jest.fn()
} as never); await service.process({
            courseResults: [{
                data: course, index: 0, relativePath: "0-course"
            }], moduleIndexFilterByDisplayId: null, milestoneIndexFilterByDisplayId: null, flashcardEnabled: false
        }) })

    it("seeds metadata, propagates premium modules, and runs every nested processor",
        async () => {
            jest.mocked(getAppConfig).mockReturnValue({
                systemConfig: {
                    course: {
                        defaultPricingPhase: PricingPhase.Pioneer,
                    },
                },
            } as never)
            const courseResult = {
                data: {
                    id: "c2",
                    displayId: "course-two",
                },
                index: 0,
                relativePath: "0-course-two",
            }
            const partitionUuidSync = jest.fn().mockResolvedValue({
                createEntities: [],
                updateEntities: [],
                deleteEntities: [],
            })
            const entityManager = {
                findOne: jest.fn().mockResolvedValue(null),
                find: jest.fn().mockResolvedValue([{
                    id: "module-premium"
                }]),
                create: jest.fn().mockReturnValue({
                    currentPhase: PricingPhase.Pioneer
                }),
                save: jest.fn().mockResolvedValue(undefined),
                update: jest.fn().mockResolvedValue(undefined),
            }
            const nested = {
                process: jest.fn().mockResolvedValue(undefined),
            }
            const service = new CourseProcessorService(
                entityManager as never,
                {
                    partitionUuidSync,
                } as never,
                nested as never,
                nested as never,
                nested as never,
                nested as never,
                nested as never,
                nested as never,
            )

            await service.process({
                courseResults: [courseResult],
                moduleIndexFilterByDisplayId: null,
                milestoneIndexFilterByDisplayId: null,
                flashcardEnabled: true,
            } as never)

            expect(partitionUuidSync).toHaveBeenCalledWith(expect.objectContaining({
                entityClass: CourseEntity,
                entities: [courseResult.data],
            }))
            expect(entityManager.findOne).toHaveBeenCalled()
            expect(entityManager.save).toHaveBeenCalled()
            expect(entityManager.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    module: expect.anything()
                }),
                {
                    isPremium: true
                },
            )
            expect(nested.process).toHaveBeenCalledTimes(6)
        })

    it("does not update contents when no premium modules exist or metadata already exists",
        async () => {
            jest.mocked(getAppConfig).mockReturnValue({
            } as never)
            const entityManager = {
                findOne: jest.fn().mockResolvedValue({
                    id: "metadata"
                }),
                find: jest.fn().mockResolvedValue([]),
                create: jest.fn(),
                save: jest.fn(),
                update: jest.fn(),
            }
            const nested = {
                process: jest.fn().mockResolvedValue(undefined),
            }
            const service = new CourseProcessorService(
                entityManager as never,
                {
                    partitionUuidSync: jest.fn().mockResolvedValue({
                        deleteEntities: []
                    }),
                } as never,
                nested as never,
                nested as never,
                nested as never,
                nested as never,
                nested as never,
                nested as never,
            )

            await service.process({
                courseResults: [{
                    data: {
                        id: "c3",
                        displayId: "course-three",
                    },
                }],
                moduleIndexFilterByDisplayId: null,
            } as never)

            expect(entityManager.create).not.toHaveBeenCalled()
            expect(entityManager.update).not.toHaveBeenCalled()
            expect(nested.process).toHaveBeenCalledTimes(6)
        })

    it("uses EarlyBird when no pricing phase is configured for new metadata",
        async () => {
            jest.mocked(getAppConfig).mockReturnValue({
                systemConfig: {
                    course: {
                    },
                },
            } as never)
            const entityManager = {
                findOne: jest.fn().mockResolvedValue(null),
                create: jest.fn((_entity: unknown, value: unknown) => value),
                save: jest.fn().mockResolvedValue(undefined),
            }
            const service = new CourseProcessorService(
                entityManager as never,
                {
                } as never,
                {
                } as never,
                {
                } as never,
                {
                } as never,
                {
                } as never,
                {
                } as never,
                {
                } as never,
            )
            const seedMetadata = (service as unknown as {
                seedCourseMetadataIfMissing: (courseId: string) => Promise<void>
            }).seedCourseMetadataIfMissing.bind(service)

            await seedMetadata("course-new")

            expect(entityManager.create).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    course: {
                        id: "course-new"
                    },
                    currentPhase: PricingPhase.EarlyBird,
                }),
            )
            expect(entityManager.save).toHaveBeenCalled()
        })
    })
