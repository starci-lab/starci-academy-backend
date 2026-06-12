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
    EnqueueProcessGitSubmissionJobService,
    EnqueueProcessGitSubmissionV2JobService,
    EnqueueProcessGoogleDocsSubmissionJobService,
    EnqueueProcessGoogleDocsSubmissionV2JobService,
    CreditUsageService,
} from "@modules/bussiness"
import {
    AiEntitlementService,
    GradingLaneValidationService,
} from "@modules/ai"
import {
    AiMode,
    ModelProvider,
    PostgreSqlAdvisoryLockService,
    SubmissionType,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
    ChallengeSubmissionNotFoundException,
    SubmissionUrlInvalidException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
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
    SubmitChallengeSubmissionCommand,
} from "./submit-challenge-submission.command"
import {
    SubmitChallengeSubmissionHandler,
} from "./submit-challenge-submission.handler"

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

/**
 * A validated BYOK grading lane — chosen so `assertGradingQuota` returns early
 * (BYOK is never quota-gated) and the AI-selection mapper has model + provider.
 */
const byokLane = {
    mode: AiMode.Byok,
    byokModel: "gpt-4o",
    byokProvider: ModelProvider.OpenAI,
    gradingModel: null,
    gradingProvider: null,
}

describe("SubmitChallengeSubmissionHandler",
    () => {
        let module: TestingModule
        let handler: SubmitChallengeSubmissionHandler
        let entityManager: EntityManagerMock
        let enqueueGitV1: jest.Mocked<Pick<EnqueueProcessGitSubmissionJobService, "enqueue">>
        let enqueueGitV2: jest.Mocked<Pick<EnqueueProcessGitSubmissionV2JobService, "enqueue">>
        let enqueueDocsV1: jest.Mocked<Pick<EnqueueProcessGoogleDocsSubmissionJobService, "enqueue">>
        let enqueueDocsV2: jest.Mocked<Pick<EnqueueProcessGoogleDocsSubmissionV2JobService, "enqueue">>
        let gradingLaneValidationService: jest.Mocked<Pick<GradingLaneValidationService, "validate">>
        let advisoryLock: jest.Mocked<
            Pick<PostgreSqlAdvisoryLockService, "acquireUserChallengeSubmissionXactLock">
        >

        beforeEach(async () => {
            // fresh jest-backed entity manager — `transaction` runs callbacks inline
            entityManager = makeEntityManagerMock()
            // the handler also calls findOneOrFail inside the upsert transaction
            entityManager.findOneOrFail = jest.fn()

            // four enqueue services; each returns a job handle
            enqueueGitV1 = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-git-v1",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueProcessGitSubmissionJobService, "enqueue">>
            enqueueGitV2 = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-git-v2",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueProcessGitSubmissionV2JobService, "enqueue">>
            enqueueDocsV1 = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-docs-v1",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueProcessGoogleDocsSubmissionJobService, "enqueue">>
            enqueueDocsV2 = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-docs-v2",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueProcessGoogleDocsSubmissionV2JobService, "enqueue">>

            // lane validation resolves a BYOK lane (skips the quota gate entirely)
            gradingLaneValidationService = {
                validate: jest.fn().mockResolvedValue(byokLane),
            } as unknown as jest.Mocked<Pick<GradingLaneValidationService, "validate">>

            // advisory lock is a no-op in the unit test
            advisoryLock = {
                acquireUserChallengeSubmissionXactLock: jest.fn(),
            } as unknown as jest.Mocked<
                Pick<PostgreSqlAdvisoryLockService, "acquireUserChallengeSubmissionXactLock">
            >

            module = await Test.createTestingModule({
                providers: [
                    SubmitChallengeSubmissionHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) → use the real one
                    DayjsService,
                    {
                        provide: EnqueueProcessGitSubmissionJobService,
                        useValue: enqueueGitV1,
                    },
                    {
                        provide: EnqueueProcessGitSubmissionV2JobService,
                        useValue: enqueueGitV2,
                    },
                    {
                        provide: EnqueueProcessGoogleDocsSubmissionJobService,
                        useValue: enqueueDocsV1,
                    },
                    {
                        provide: EnqueueProcessGoogleDocsSubmissionV2JobService,
                        useValue: enqueueDocsV2,
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
                        // never reached on the BYOK happy path, but required by DI
                        provide: CreditUsageService,
                        useValue: {
                            getSnapshot: jest.fn(),
                        },
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: {
                            snapshot: jest.fn(),
                        },
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<SubmitChallengeSubmissionHandler>(SubmitChallengeSubmissionHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no DB access)",
            async () => {
                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-1",
                                mode: AiMode.Byok,
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("throws when the challenge submission does not exist",
            async () => {
                // first findOne (ChallengeSubmissionEntity) resolves null
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "missing",
                                mode: AiMode.Byok,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeSubmissionNotFoundException)
            })

        it("throws when the parent challenge does not exist",
            async () => {
                // submission found, but its parent challenge lookup resolves null
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-1",
                                mode: AiMode.Byok,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeNotFoundException)
            })

        it("enqueues the V1 git pipeline for a legacy challenge on the happy path",
            async () => {
                // submission + (unverified) challenge are found
                entityManager.findOne
                    // 1. ChallengeSubmissionEntity
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    // 2. ChallengeEntity (verified=false → V1 pipeline)
                    .mockResolvedValueOnce({
                        id: "chal-1",
                        verified: false,
                    })
                    // 3. inside the upsert tx: existing user submission with a url
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                    })
                    // 4. re-load after the tx
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                        selectedLang: null,
                    })
                    // 5. CourseEntity lookup
                    .mockResolvedValueOnce({
                        id: "course-1",
                    })
                    // 6. EnrollmentEntity lookup
                    .mockResolvedValueOnce({
                        id: "enroll-1",
                    })

                const result = await handler.execute(
                    new SubmitChallengeSubmissionCommand({
                        request: {
                            challengeSubmissionId: "sub-1",
                            mode: AiMode.Byok,
                            selectedModel: "gpt-4o",
                            selectedModelProvider: ModelProvider.OpenAI,
                            byokApiKey: "sk-key",
                        },
                        user: fakeUser("user-1"),
                        locale: undefined,
                    }),
                )

                // the lane is validated and the V1 git job is enqueued
                expect(gradingLaneValidationService.validate).toHaveBeenCalled()
                expect(enqueueGitV1.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        enrollmentId: "enroll-1",
                        courseId: "course-1",
                        userChallengeSubmissionId: "ucs-1",
                    }),
                )
                // the V2 git path is not taken for a legacy challenge
                expect(enqueueGitV2.enqueue).not.toHaveBeenCalled()
                expect(result).toEqual({
                    jobId: "job-git-v1",
                })
            })

        it("enqueues the V2 git pipeline for a verified challenge",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    // verified=true → V2 pipeline
                    .mockResolvedValueOnce({
                        id: "chal-1",
                        verified: true,
                    })
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                    })
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                        selectedLang: "typescript",
                    })
                    .mockResolvedValueOnce({
                        id: "course-1",
                    })
                    .mockResolvedValueOnce({
                        id: "enroll-1",
                    })

                const result = await handler.execute(
                    new SubmitChallengeSubmissionCommand({
                        request: {
                            challengeSubmissionId: "sub-1",
                            mode: AiMode.Byok,
                            lang: "typescript",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the verified challenge routes to the V2 git pipeline with the lang
                expect(enqueueGitV2.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        lang: "typescript",
                    }),
                )
                expect(enqueueGitV1.enqueue).not.toHaveBeenCalled()
                expect(result).toEqual({
                    jobId: "job-git-v2",
                })
            })

        it("rejects a first-time submission that carries no github url",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-1",
                        verified: false,
                    })
                    // inside the tx: no existing user submission row
                    .mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-1",
                                mode: AiMode.Byok,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(SubmissionUrlInvalidException)

                // nothing is enqueued without a url to grade
                expect(enqueueGitV1.enqueue).not.toHaveBeenCalled()
            })
    })
