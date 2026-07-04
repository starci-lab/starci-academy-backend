// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    GradingLaneValidationService,
} from "@modules/ai"
import {
    ModelProvider,
    PostgreSqlAdvisoryLockService,
} from "@modules/databases"
import {
    ChallengeSubmissionNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    UrlValidatorService,
} from "@modules/vaildators"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    UserEntity,
} from "@modules/databases"
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
            // fresh jest-backed entity manager — `transaction` runs the callback inline
            entityManager = makeEntityManagerMock()

            // url validation hook — only invoked when a url is supplied
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
                    // 2. existing UserChallengeSubmissionEntity → none
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
                            // no url → validation skipped; only the model pick is synced
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
    })
