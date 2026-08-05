// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle (mirrors sync-submission.handler.spec.ts).
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    CvGenerationNotFoundException,
} from "@modules/platform/exceptions/errors/api/cv-generation-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    EnqueueGenerateCvJobService,
} from "../../../../../processors/ai/generate-cv/enqueue-generate-cv.service"
import {
    ReviseCvCommand,
} from "./revise-cv.command"
import {
    ReviseCvHandler,
} from "./revise-cv.handler"

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

describe("ReviseCvHandler",
    () => {
        let module: TestingModule
        let handler: ReviseCvHandler
        let entityManager: EntityManagerMock
        let enqueueGenerateCvJobService: jest.Mocked<Pick<EnqueueGenerateCvJobService, "enqueue">>
        let gradingLaneValidationService: jest.Mocked<Pick<GradingLaneValidationService, "validate">>

        beforeEach(async () => {
            // fresh jest-backed entity manager -- only `findOne` (ownership check) is
            // exercised by this handler; no real DB access
            entityManager = makeEntityManagerMock()

            // enqueue service is mocked wholesale -- this handler only calls `enqueue`
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
                    ReviseCvHandler,
                    {
                        provide: EnqueueGenerateCvJobService,
                        useValue: enqueueGenerateCvJobService,
                    },
                    {
                        provide: GradingLaneValidationService,
                        useValue: gradingLaneValidationService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ReviseCvHandler>(ReviseCvHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("execute",
            () => {
                it("throws when there is no authenticated user (never looks up the submission)",
                    async () => {
                        await expect(
                            handler.execute(
                                new ReviseCvCommand({
                                    request: {
                                        cvSubmissionId: "sub-1",
                                    },
                                    user: undefined,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(UserNotFoundException)

                        // the guard fires before the ownership lookup or any downstream call
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(gradingLaneValidationService.validate).not.toHaveBeenCalled()
                        expect(enqueueGenerateCvJobService.enqueue).not.toHaveBeenCalled()
                    })

                it("throws when the source CV generation does not exist (or does not belong to the caller)",
                    async () => {
                        // findOne resolves null -> generation missing / not owned by this user
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            handler.execute(
                                new ReviseCvCommand({
                                    request: {
                                        cvSubmissionId: "missing-sub",
                                    },
                                    user: fakeUser("user-1"),
                                }),
                            ),
                        ).rejects.toBeInstanceOf(CvGenerationNotFoundException)

                        // never reaches lane validation or enqueue once ownership fails
                        expect(gradingLaneValidationService.validate).not.toHaveBeenCalled()
                        expect(enqueueGenerateCvJobService.enqueue).not.toHaveBeenCalled()
                    })

                it("threads cvSubmissionId + courseId/label/targetRole/language plus the lane pick into the enqueue call",
                    async () => {
                        // ownership check passes
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "sub-1",
                        })
                        // an explicit model pick -- proves selectedModel/selectedModelProvider
                        // flow through gradingLaneValidationService.validate(...)
                        gradingLaneValidationService.validate.mockResolvedValueOnce({
                            gradingModel: "gpt-4o",
                            gradingProvider: ModelProvider.OpenAI,
                        } as never)

                        await handler.execute(
                            new ReviseCvCommand({
                                request: {
                                    cvSubmissionId: "sub-1",
                                    extraPrompts: "Ships production systems.",
                                    selectedModel: "gpt-4o",
                                    selectedModelProvider: ModelProvider.OpenAI,
                                    courseId: "course-1",
                                    label: "My revised CV",
                                    targetRole: "Staff Engineer",
                                    language: "en",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        // the ownership lookup is scoped to this user
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                where: expect.objectContaining({
                                    id: "sub-1",
                                    user: {
                                        id: "user-1",
                                    },
                                }),
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
                        // cvSubmissionId (as sourceCvSubmissionId) + the new optional args are
                        // threaded through to the enqueue service verbatim
                        expect(enqueueGenerateCvJobService.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-1",
                                sourceCvSubmissionId: "sub-1",
                                extraPrompts: "Ships production systems.",
                                courseId: "course-1",
                                label: "My revised CV",
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
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "sub-2",
                        })

                        await handler.execute(
                            new ReviseCvCommand({
                                request: {
                                    cvSubmissionId: "sub-2",
                                },
                                user: fakeUser("user-2"),
                            }),
                        )

                        // absent request fields collapse to undefined via `?? undefined`,
                        // rather than being dropped or defaulted to some other value
                        expect(enqueueGenerateCvJobService.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-2",
                                sourceCvSubmissionId: "sub-2",
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
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "sub-3",
                        })

                        const result = await handler.execute(
                            new ReviseCvCommand({
                                request: {
                                    cvSubmissionId: "sub-3",
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
