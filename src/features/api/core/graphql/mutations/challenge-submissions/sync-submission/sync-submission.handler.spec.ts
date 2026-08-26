// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
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
    PostgreSqlAdvisoryLockService,
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
import {
    ChallengeSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-submission-not-found"
import {
    SubmissionUrlInvalidException,
} from "@modules/platform/exceptions/errors/courses/submission-url-invalid"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    UrlValidatorService,
} from "@modules/lib/validators/url.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    SyncSubmissionCommand,
} from "./sync-submission.command"
import {
    SyncSubmissionHandler,
} from "./sync-submission.handler"

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

describe("SyncSubmissionHandler",
    () => {
        let module: TestingModule
        let handler: SyncSubmissionHandler
        let entityManager: EntityManagerMock
        let urlValidatorService: jest.Mocked<Pick<UrlValidatorService, "isValid">>
        let advisoryLock: jest.Mocked<
            Pick<PostgreSqlAdvisoryLockService, "acquireUserChallengeSubmissionXactLock">
        >
        let gradingLaneValidationService: jest.Mocked<Pick<GradingLaneValidationService, "validate">>

        beforeEach(async () => {
            // fresh jest-backed entity manager -- `transaction` runs the callback inline
            entityManager = makeEntityManagerMock()

            // url validation hook -- only invoked when a url is supplied
            urlValidatorService = {
                isValid: jest.fn(),
            } as unknown as jest.Mocked<Pick<UrlValidatorService, "isValid">>

            // advisory lock is a no-op in the unit test
            advisoryLock = {
                acquireUserChallengeSubmissionXactLock: jest.fn(),
            } as unknown as jest.Mocked<
                Pick<PostgreSqlAdvisoryLockService, "acquireUserChallengeSubmissionXactLock">
            >

            // lane validation resolves no pinned model by default
            gradingLaneValidationService = {
                validate: jest.fn().mockResolvedValue({
                    gradingModel: null,
                    gradingProvider: null,
                }),
            } as unknown as jest.Mocked<Pick<GradingLaneValidationService, "validate">>

            module = await Test.createTestingModule({
                providers: [
                    SyncSubmissionHandler,
                    {
                        provide: UrlValidatorService,
                        useValue: urlValidatorService,
                    },
                    {
                        provide: PostgreSqlAdvisoryLockService,
                        useValue: advisoryLock,
                    },
                    {
                        provide: GradingLaneValidationService,
                        useValue: gradingLaneValidationService,
                    },
                    {
                        // best-effort trial-enrollment resolution -- a bare stub keeps the
                        // enrollment-lookup path inert for these specs
                        provide: UserService,
                        useValue: {
                            resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue(null),
                        },
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<SyncSubmissionHandler>(SyncSubmissionHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no transaction)",
            async () => {
                await expect(
                    handler.execute(
                        new SyncSubmissionCommand({
                            request: {
                                id: "sub-1",
                                url: "https://github.com/me/repo",
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // guard fires before opening a transaction
                expect(entityManager.transaction).not.toHaveBeenCalled()
            })

        it("throws when the challenge submission does not exist",
            async () => {
                // inside the tx: the challenge submission lookup resolves null
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new SyncSubmissionCommand({
                            request: {
                                id: "missing",
                                url: "https://github.com/me/repo",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeSubmissionNotFoundException)
            })

        it("validates the url and creates a new user submission row when none exists",
            async () => {
                entityManager.findOne
                    // 1. ChallengeSubmissionEntity
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        type: "githubUrl",
                    })
                    // 2. existing UserChallengeSubmissionEntity -> none
                    .mockResolvedValueOnce(null)

                await handler.execute(
                    new SyncSubmissionCommand({
                        request: {
                            id: "sub-1",
                            url: "https://github.com/me/repo",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the supplied url is validated against the submission type
                expect(urlValidatorService.isValid).toHaveBeenCalledWith(
                    expect.objectContaining({
                        url: "https://github.com/me/repo",
                    }),
                )
                // a new user submission row is created + persisted
                expect(entityManager.create).toHaveBeenCalled()
                expect(entityManager.save).toHaveBeenCalled()
            })

        it("skips url validation on a selection-only sync and updates the model pick",
            async () => {
                const existing = {
                    id: "ucs-1",
                    submissionUrl: "https://github.com/me/repo",
                    selectedModel: null,
                    selectedModelProvider: null,
                }
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        type: "githubUrl",
                    })
                    .mockResolvedValueOnce(existing)
                // lane validation returns a concrete pinned model
                gradingLaneValidationService.validate.mockResolvedValueOnce({
                    gradingModel: "gpt-4o",
                    gradingProvider: ModelProvider.OpenAI,
                } as never)

                await handler.execute(
                    new SyncSubmissionCommand({
                        request: {
                            id: "sub-1",
                            // no url -> validation skipped; only the model pick is synced
                            selectedModel: "gpt-4o",
                            selectedModelProvider: ModelProvider.OpenAI,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // url validation is skipped when no url is supplied
                expect(urlValidatorService.isValid).not.toHaveBeenCalled()
                // the validated model pick is written onto the existing row + saved
                expect(existing.selectedModel).toBe("gpt-4o")
                expect(entityManager.save).toHaveBeenCalled()
            })
        it("creates a selection-only row with an empty URL without invoking URL validation",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        type: "githubUrl",
                    })
                    .mockResolvedValueOnce(null)

                await handler.execute(new SyncSubmissionCommand({
                    request: {
                        id: "sub-1",
                    },
                    user: fakeUser("user-1"),
                }))

                expect(urlValidatorService.isValid).not.toHaveBeenCalled()
                expect(entityManager.create).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        submissionUrl: "",
                        processed: false,
                    }))
            })
        it("propagates an invalid URL result before creating or saving a row",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "sub-1",
                    type: "githubUrl",
                })
                urlValidatorService.isValid.mockRejectedValueOnce(new SubmissionUrlInvalidException({
                    id: "sub-1",
                    submissionType: "githubUrl" as never,
                    url: "not-a-url",
                }))

                await expect(handler.execute(new SyncSubmissionCommand({
                    request: {
                        id: "sub-1",
                        url: "not-a-url",
                    },
                    user: fakeUser("user-1"),
                }))).rejects.toBeInstanceOf(SubmissionUrlInvalidException)
                expect(entityManager.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("clears a supplied grading lane when validation returns no eligible pin",
            async () => {
                const existing = {
                    id: "ucs-2",
                    selectedModel: "old-model",
                    selectedModelProvider: ModelProvider.OpenAI,
                }
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-2",
                        type: "githubUrl",
                    })
                    .mockResolvedValueOnce(existing)
                gradingLaneValidationService.validate.mockResolvedValueOnce({
                    gradingModel: undefined,
                    gradingProvider: undefined,
                } as never)

                await handler.execute(new SyncSubmissionCommand({
                    request: {
                        id: "sub-2",
                        selectedModel: "retired-model",
                        selectedModelProvider: ModelProvider.Gemini,
                    },
                    user: fakeUser("user-1"),
                }))

                expect(existing.selectedModel).toBeNull()
                expect(existing.selectedModelProvider).toBeNull()
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.anything(),
                    existing,
                )
            })

        it("updates an existing row when a non-empty URL is synced",
            async () => {
                const existing = {
                    id: "ucs-3",
                    submissionUrl: "https://github.com/old/repo",
                }
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-3",
                        type: "githubUrl",
                    })
                    .mockResolvedValueOnce(existing)

                await handler.execute(new SyncSubmissionCommand({
                    request: {
                        id: "sub-3",
                        url: "https://github.com/new/repo",
                    },
                    user: fakeUser("user-1"),
                }))

                expect(urlValidatorService.isValid).toHaveBeenCalled()
                expect(existing.submissionUrl).toBe("https://github.com/new/repo")
                expect(entityManager.create).not.toHaveBeenCalled()
            })

        it("rejects an unknown challenge submission before URL validation",
            async () => {
                const failure = new Error("submission missing")
                entityManager.findOne.mockRejectedValueOnce(failure)

                await expect(handler.execute(new SyncSubmissionCommand({
                    request: {
                        id: "missing",
                        url: "https://github.com/new/repo",
                    },
                    user: fakeUser("user-1"),
                }))).rejects.toBe(failure)
                expect(urlValidatorService.isValid).not.toHaveBeenCalled()
            })
    })
