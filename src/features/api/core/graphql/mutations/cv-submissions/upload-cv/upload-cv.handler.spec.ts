// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle (mirrors generate-cv.handler.spec.ts).
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    EnqueueScoreUploadedCvJobService,
} from "../../../../../processors/ai/score-uploaded-cv/enqueue-score-uploaded-cv.service"
import {
    UploadCvCommand,
} from "./upload-cv.command"
import {
    UploadCvHandler,
} from "./upload-cv.handler"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"

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
        let enqueueScoreUploadedCvJobService: jest.Mocked<Pick<EnqueueScoreUploadedCvJobService, "enqueue">>
        let gradingLaneValidationService: jest.Mocked<Pick<GradingLaneValidationService, "validate">>

        beforeEach(async () => {
            // enqueue service is mocked wholesale -- reports back a tracked jobId
            enqueueScoreUploadedCvJobService = {
                enqueue: jest.fn().mockResolvedValue({
                    cvGeneration: {
                        id: "cv-gen-upload-1",
                    },
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
                                        targetLevel: CvTargetLevel.Junior,
                                    },
                                    user: undefined,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(UserNotFoundException)

                        expect(gradingLaneValidationService.validate).not.toHaveBeenCalled()
                        expect(enqueueScoreUploadedCvJobService.enqueue).not.toHaveBeenCalled()
                    })

                it("creates a Pending source=uploaded row with the cdnKey + customization, then enqueues scoring",
                    async () => {
                        // an explicit model pick -- proves selectedModel/provider flow through
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
                                    targetLevel: CvTargetLevel.Senior,
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
                        // scoring is enqueued for the freshly-created row + resolved lane
                        expect(enqueueScoreUploadedCvJobService.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-1",
                                cdnKey: "users/cv-submissions/user-1/resume.pdf",
                                courseId: "course-1",
                                label: "My uploaded CV",
                                targetRole: "Staff Engineer",
                                language: "en",
                                targetLevel: CvTargetLevel.Senior,
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
                                    targetLevel: CvTargetLevel.Mid,
                                },
                                user: fakeUser("user-2"),
                            }),
                        )

                        expect(enqueueScoreUploadedCvJobService.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                cdnKey: "users/cv-submissions/user-2/cv.pdf",
                                courseId: undefined,
                                label: undefined,
                                targetRole: undefined,
                                language: "en",
                                targetLevel: CvTargetLevel.Mid,
                            }),
                        )
                    })
            })
    })
