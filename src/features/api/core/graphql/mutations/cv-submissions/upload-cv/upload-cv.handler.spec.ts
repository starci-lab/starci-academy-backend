// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle (mirrors generate-cv.handler.spec.ts).
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    GradingLaneValidationService,
} from "@modules/ai"
import {
    CvGenerationMode,
    CvGenerationStatus,
    CvSource,
    ModelProvider,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    UserEntity,
} from "@modules/databases"
import {
    EnqueueScoreUploadedCvJobService,
} from "@features/api/processors/ai/score-uploaded-cv"
import {
    UploadCvCommand,
} from "./upload-cv.command"
import {
    UploadCvHandler,
} from "./upload-cv.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("UploadCvHandler",
    () => {
        let module: TestingModule
        let handler: UploadCvHandler
        let entityManager: jest.Mocked<Pick<EntityManager, "create" | "save">>
        let enqueueScoreUploadedCvJobService: jest.Mocked<Pick<EnqueueScoreUploadedCvJobService, "enqueue">>
        let gradingLaneValidationService: jest.Mocked<Pick<GradingLaneValidationService, "validate">>

        beforeEach(async () => {
            // entity manager mock — `create` echoes its payload, `save` stamps an id
            entityManager = {
                create: jest.fn().mockImplementation((_entity, data) => data),
                save: jest.fn().mockImplementation(async (_entity, data) => ({
                    id: "cv-gen-upload-1",
                    ...data,
                })),
            } as unknown as jest.Mocked<Pick<EntityManager, "create" | "save">>

            // enqueue service is mocked wholesale — reports back a tracked jobId
            enqueueScoreUploadedCvJobService = {
                enqueue: jest.fn().mockResolvedValue({
                    jobId: "job-1",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueScoreUploadedCvJobService, "enqueue">>

            // lane validation resolves no pinned model by default
            gradingLaneValidationService = {
                validate: jest.fn().mockResolvedValue({
                    gradingModel: null,
                    gradingProvider: null,
                }),
            } as unknown as jest.Mocked<Pick<GradingLaneValidationService, "validate">>

            module = await Test.createTestingModule({
                providers: [
                    UploadCvHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EnqueueScoreUploadedCvJobService,
                        useValue: enqueueScoreUploadedCvJobService,
                    },
                    {
                        provide: GradingLaneValidationService,
                        useValue: gradingLaneValidationService,
                    },
                ],
            }).compile()

            handler = module.get<UploadCvHandler>(UploadCvHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("execute",
            () => {
                it("throws when there is no authenticated user (never creates a row, validates a lane, or enqueues)",
                    async () => {
                        await expect(
                            handler.execute(
                                new UploadCvCommand({
                                    request: {
                                        cdnKey: "users/cv-submissions/user-1/resume.pdf",
                                    },
                                    user: undefined,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(UserNotFoundException)

                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(gradingLaneValidationService.validate).not.toHaveBeenCalled()
                        expect(enqueueScoreUploadedCvJobService.enqueue).not.toHaveBeenCalled()
                    })

                it("creates a Pending source=uploaded row with the cdnKey + customization, then enqueues scoring",
                    async () => {
                        // an explicit model pick — proves selectedModel/provider flow through
                        gradingLaneValidationService.validate.mockResolvedValueOnce({
                            gradingModel: "gpt-4o",
                            gradingProvider: ModelProvider.OpenAI,
                        } as never)

                        const result = await handler.execute(
                            new UploadCvCommand({
                                request: {
                                    cdnKey: "users/cv-submissions/user-1/resume.pdf",
                                    selectedModel: "gpt-4o",
                                    selectedModelProvider: ModelProvider.OpenAI,
                                    courseId: "course-1",
                                    label: "My uploaded CV",
                                    targetRole: "Staff Engineer",
                                    language: "en",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        // the request's model/provider are forwarded to lane validation
                        expect(gradingLaneValidationService.validate).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-1",
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                            }),
                        )
                        // the created row is the UNIFIED uploaded shape: source=uploaded,
                        // Pending, carrying the cdnKey + customization + course relation
                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserCvGenerationEntity,
                            expect.objectContaining({
                                user: {
                                    id: "user-1",
                                },
                                mode: CvGenerationMode.Generate,
                                source: CvSource.Uploaded,
                                status: CvGenerationStatus.Pending,
                                uploadedCdnKey: "users/cv-submissions/user-1/resume.pdf",
                                course: {
                                    id: "course-1",
                                },
                                label: "My uploaded CV",
                                targetRole: "Staff Engineer",
                                language: "en",
                            }),
                        )
                        // scoring is enqueued for the freshly-created row + resolved lane
                        expect(enqueueScoreUploadedCvJobService.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                cvGenerationId: "cv-gen-upload-1",
                                userId: "user-1",
                                ai: expect.objectContaining({
                                    model: "gpt-4o",
                                    provider: ModelProvider.OpenAI,
                                }),
                            }),
                        )
                        // returns the created row id + the tracked scoring job id
                        expect(result).toEqual({
                            jobId: "job-1",
                            cvGenerationId: "cv-gen-upload-1",
                        })
                    })

                it("nulls the optional customization fields + course when the request omits them",
                    async () => {
                        await handler.execute(
                            new UploadCvCommand({
                                request: {
                                    cdnKey: "users/cv-submissions/user-2/cv.pdf",
                                },
                                user: fakeUser("user-2"),
                            }),
                        )

                        // absent fields collapse to null (not undefined / dropped) on the row,
                        // and no course relation is attached
                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserCvGenerationEntity,
                            expect.objectContaining({
                                uploadedCdnKey: "users/cv-submissions/user-2/cv.pdf",
                                course: null,
                                label: null,
                                targetRole: null,
                                language: null,
                            }),
                        )
                    })
            })
    })
