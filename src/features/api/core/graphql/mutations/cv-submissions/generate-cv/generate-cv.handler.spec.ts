// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle (mirrors sync-submission.handler.spec.ts).
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    GradingLaneValidationService,
} from "@modules/ai"
import {
    ModelProvider,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    UserEntity,
} from "@modules/databases"
import {
    EnqueueGenerateCvJobService,
} from "@features/api/processors/ai/generate-cv"
import {
    GenerateCvCommand,
} from "./generate-cv.command"
import {
    GenerateCvHandler,
} from "./generate-cv.handler"

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

describe("GenerateCvHandler",
    () => {
        let module: TestingModule
        let handler: GenerateCvHandler
        let enqueueGenerateCvJobService: jest.Mocked<Pick<EnqueueGenerateCvJobService, "enqueue">>
        let gradingLaneValidationService: jest.Mocked<Pick<GradingLaneValidationService, "validate">>

        beforeEach(async () => {
            // enqueue service is mocked wholesale — this handler only calls `enqueue`
            // and reads back `{ cvGeneration, jobId }`, never touches the DB itself
            enqueueGenerateCvJobService = {
                enqueue: jest.fn().mockResolvedValue({
                    cvGeneration: {
                        id: "cv-gen-1",
                    },
                    jobId: "job-1",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueGenerateCvJobService, "enqueue">>

            // lane validation resolves no pinned model by default
            gradingLaneValidationService = {
                validate: jest.fn().mockResolvedValue({
                    gradingModel: null,
                    gradingProvider: null,
                }),
            } as unknown as jest.Mocked<Pick<GradingLaneValidationService, "validate">>

            module = await Test.createTestingModule({
                providers: [
                    GenerateCvHandler,
                    {
                        provide: EnqueueGenerateCvJobService,
                        useValue: enqueueGenerateCvJobService,
                    },
                    {
                        provide: GradingLaneValidationService,
                        useValue: gradingLaneValidationService,
                    },
                ],
            }).compile()

            handler = module.get<GenerateCvHandler>(GenerateCvHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("execute",
            () => {
                it("throws when there is no authenticated user (never reaches lane validation or enqueue)",
                    async () => {
                        await expect(
                            handler.execute(
                                new GenerateCvCommand({
                                    request: {
                                        extraPrompts: "Backend focus.",
                                    },
                                    user: undefined,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(UserNotFoundException)

                        // the guard fires before any lane validation or enqueue happens
                        expect(gradingLaneValidationService.validate).not.toHaveBeenCalled()
                        expect(enqueueGenerateCvJobService.enqueue).not.toHaveBeenCalled()
                    })

                it("threads courseId/label/targetRole/language plus the lane pick into the enqueue call",
                    async () => {
                        // an explicit model pick — proves selectedModel/selectedModelProvider
                        // flow through gradingLaneValidationService.validate(...)
                        gradingLaneValidationService.validate.mockResolvedValueOnce({
                            gradingModel: "gpt-4o",
                            gradingProvider: ModelProvider.OpenAI,
                        } as never)

                        await handler.execute(
                            new GenerateCvCommand({
                                request: {
                                    extraPrompts: "Ships production systems.",
                                    selectedModel: "gpt-4o",
                                    selectedModelProvider: ModelProvider.OpenAI,
                                    courseId: "course-1",
                                    label: "My senior CV",
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
                        // the new optional args are threaded through to the enqueue service
                        // verbatim, alongside the resolved AI selection
                        expect(enqueueGenerateCvJobService.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-1",
                                extraPrompts: "Ships production systems.",
                                courseId: "course-1",
                                label: "My senior CV",
                                targetRole: "Staff Engineer",
                                language: "en",
                                ai: expect.objectContaining({
                                    model: "gpt-4o",
                                    provider: ModelProvider.OpenAI,
                                }),
                            }),
                        )
                    })

                it("forwards the new optional args as undefined when the request omits them (no crash)",
                    async () => {
                        await handler.execute(
                            new GenerateCvCommand({
                                request: {
                                },
                                user: fakeUser("user-2"),
                            }),
                        )

                        // absent request fields collapse to undefined via `?? undefined`,
                        // rather than being dropped or defaulted to some other value
                        expect(enqueueGenerateCvJobService.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-2",
                                extraPrompts: undefined,
                                courseId: undefined,
                                label: undefined,
                                targetRole: undefined,
                                language: undefined,
                            }),
                        )
                    })

                it("returns the jobId + cvGenerationId reported by the enqueue service",
                    async () => {
                        const result = await handler.execute(
                            new GenerateCvCommand({
                                request: {
                                },
                                user: fakeUser("user-3"),
                            }),
                        )

                        expect(result).toEqual({
                            jobId: "job-1",
                            cvGenerationId: "cv-gen-1",
                        })
                    })
            })
    })
