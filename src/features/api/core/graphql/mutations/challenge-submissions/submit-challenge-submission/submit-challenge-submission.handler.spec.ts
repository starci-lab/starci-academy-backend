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
    EnqueueProcessGitSubmissionJobService,
} from "@modules/bussiness/jobs/enqueue/process-git-submission.service"
import {
    EnqueueProcessGoogleDocsSubmissionJobService,
} from "@modules/bussiness/jobs/enqueue/process-google-docs-submission.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    SubmissionType,
} from "@modules/databases/postgresql/primary/enums/submission-type"
import {
    PostgreSqlAdvisoryLockService,
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
import {
    ChallengeNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"
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
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
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
 * A validated grading lane with no pinned model -- the default every test submits on.
 */
const autoLane = {
    gradingModel: null,
    gradingProvider: null,
}

describe("SubmitChallengeSubmissionHandler",
    () => {
        let module: TestingModule
        let handler: SubmitChallengeSubmissionHandler
        let entityManager: EntityManagerMock
        let enqueueGitV2: jest.Mocked<Pick<EnqueueProcessGitSubmissionJobService, "enqueue">>
        let enqueueDocsV2: jest.Mocked<Pick<EnqueueProcessGoogleDocsSubmissionJobService, "enqueue">>
        let gradingLaneValidationService: jest.Mocked<Pick<GradingLaneValidationService, "validate">>
        let advisoryLock: jest.Mocked<
            Pick<PostgreSqlAdvisoryLockService, "acquireUserChallengeSubmissionXactLock">
        >
        let userService: jest.Mocked<Pick<UserService, "resolveOrCreateTrialEnrollment">>

        beforeEach(async () => {
            // fresh jest-backed entity manager -- `transaction` runs callbacks inline
            entityManager = makeEntityManagerMock()
            // the handler also calls findOneOrFail inside the upsert transaction
            entityManager.findOneOrFail = jest.fn()

            // the (V2-only) enqueue services; each returns a job handle
            enqueueGitV2 = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-git-v2",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueProcessGitSubmissionJobService, "enqueue">>
            enqueueDocsV2 = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-docs-v2",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueProcessGoogleDocsSubmissionJobService, "enqueue">>

            // lane validation resolves the Auto lane
            gradingLaneValidationService = {
                validate: jest.fn().mockResolvedValue(autoLane),
            } as unknown as jest.Mocked<Pick<GradingLaneValidationService, "validate">>

            // advisory lock is a no-op in the unit test
            advisoryLock = {
                acquireUserChallengeSubmissionXactLock: jest.fn(),
            } as unknown as jest.Mocked<
                Pick<PostgreSqlAdvisoryLockService, "acquireUserChallengeSubmissionXactLock">
            >

            // best-effort trial-enrollment resolution -- resolves null by default so
            // tests that never reach the enrollment step stay inert; tests that do
            // reach it override with mockResolvedValueOnce per-case
            userService = {
                resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue(null),
            } as unknown as jest.Mocked<Pick<UserService, "resolveOrCreateTrialEnrollment">>

            module = await Test.createTestingModule({
                providers: [
                    SubmitChallengeSubmissionHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: EnqueueProcessGitSubmissionJobService,
                        useValue: enqueueGitV2,
                    },
                    {
                        provide: EnqueueProcessGoogleDocsSubmissionJobService,
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
                        provide: AiEntitlementService,
                        useValue: {
                            // quota snapshot with headroom so the pre-submit gate passes
                            snapshot: jest.fn().mockResolvedValue({
                                credit: {
                                    remaining5h: 100,
                                    remainingWeek: 100,
                                },
                                window5hResetAt: new Date(),
                                windowWeekResetAt: new Date(),
                            }),
                        },
                    },
                    {
                        provide: UserService,
                        useValue: userService,
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
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeNotFoundException)
            })

        it("enqueues the V2 git pipeline even for an unverified challenge (V1 removed)",
            async () => {
                // submission + (unverified) challenge are found
                entityManager.findOne
                    // 1. ChallengeSubmissionEntity
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    // 2. ChallengeEntity (verified=false still routes to V2 -- V1 removed)
                    .mockResolvedValueOnce({
                        id: "chal-1",
                        verified: false,
                    })
                    // 3. ContentEntity (ownerContent premium-lock check) -- no owning content found
                    .mockResolvedValueOnce(null)
                    // 4. CourseEntity lookup
                    .mockResolvedValueOnce({
                        id: "course-1",
                    })
                    // 5. inside the upsert tx: existing user submission with a url
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                    })
                    // 6. re-load after the tx
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                        selectedLang: null,
                    })
                // trial enrollment is resolved via UserService, not entityManager.findOne
                userService.resolveOrCreateTrialEnrollment.mockResolvedValueOnce({
                    id: "enroll-1",
                } as never)

                const result = await handler.execute(
                    new SubmitChallengeSubmissionCommand({
                        request: {
                            challengeSubmissionId: "sub-1",
                            selectedModel: "gpt-4o",
                            selectedModelProvider: ModelProvider.OpenAI,
                        },
                        user: fakeUser("user-1"),
                        locale: undefined,
                    }),
                )

                // the lane is validated and the (now V2-only) git job is enqueued
                expect(gradingLaneValidationService.validate).toHaveBeenCalled()
                expect(enqueueGitV2.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        enrollmentId: "enroll-1",
                        courseId: "course-1",
                        userChallengeSubmissionId: "ucs-1",
                    }),
                )
                expect(result).toEqual({
                    jobId: "job-git-v2",
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
                    // verified=true -> V2 pipeline
                    .mockResolvedValueOnce({
                        id: "chal-1",
                        verified: true,
                    })
                    // ContentEntity (ownerContent premium-lock check) -- no owning content found
                    .mockResolvedValueOnce(null)
                    // CourseEntity lookup
                    .mockResolvedValueOnce({
                        id: "course-1",
                    })
                    // inside the upsert tx: existing user submission with a url
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                    })
                    // re-load after the tx
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                        selectedLang: "typescript",
                    })
                // trial enrollment is resolved via UserService, not entityManager.findOne
                userService.resolveOrCreateTrialEnrollment.mockResolvedValueOnce({
                    id: "enroll-1",
                } as never)

                const result = await handler.execute(
                    new SubmitChallengeSubmissionCommand({
                        request: {
                            challengeSubmissionId: "sub-1",
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
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(SubmissionUrlInvalidException)

                // nothing is enqueued without a url to grade
                expect(enqueueGitV2.enqueue).not.toHaveBeenCalled()
            })
    })
