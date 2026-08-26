// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test, TestingModule
} from "@nestjs/testing"
import {
    getEntityManagerToken
} from "@nestjs/typeorm"
import {
    EnqueueProcessGitSubmissionJobService
} from "@modules/bussiness/jobs/enqueue/process-git-submission.service"
import {
    EnqueueProcessGoogleDocsSubmissionJobService
} from "@modules/bussiness/jobs/enqueue/process-google-docs-submission.service"
import {
    UserService
} from "@modules/bussiness/user/user.service"
import {
    AiEntitlementService
} from "@modules/ai/ai-entitlement.service"
import {
    GradingLaneValidationService
} from "@modules/ai/grading-lane-validation.service"
import {
    ModelProvider
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    SubmissionType
} from "@modules/databases/postgresql/primary/enums/submission-type"
import {
    PostgreSqlAdvisoryLockService
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
import {
    ChallengeNotFoundException
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"
import {
    ChallengePremiumLockedException
} from "@modules/platform/exceptions/errors/courses/challenge-premium-locked"
import {
    ChallengeSubmissionNotFoundException
} from "@modules/platform/exceptions/errors/courses/challenge-submission-not-found"
import {
    SubmissionUrlInvalidException
} from "@modules/platform/exceptions/errors/courses/submission-url-invalid"
import {
    SubmissionQuotaExceededException
} from "@modules/platform/exceptions/errors/courses/submission-quota-exceeded"
import {
    UserChallengeSubmissionNotFoundException
} from "@modules/platform/exceptions/errors/courses/user-challenge-submission-not-found"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    DayjsService
} from "@modules/lib/mixin/dayjs.service"
import {
    makeEntityManagerMock
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    SubmitChallengeSubmissionCommand
} from "./submit-challenge-submission.command"
import {
    SubmitChallengeSubmissionHandler
} from "./submit-challenge-submission.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (id: string): UserEntity =>
  ({
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
        let enqueueGitV2: jest.Mocked<
    Pick<EnqueueProcessGitSubmissionJobService, "enqueue" | "publish">
  >
        let enqueueDocsV2: jest.Mocked<
    Pick<EnqueueProcessGoogleDocsSubmissionJobService, "enqueue" | "publish">
  >
        let gradingLaneValidationService: jest.Mocked<
    Pick<GradingLaneValidationService, "validate">
  >
        let advisoryLock: jest.Mocked<
    Pick<
      PostgreSqlAdvisoryLockService,
      "acquireUserChallengeSubmissionXactLock"
    >
  >
        let userService: jest.Mocked<
    Pick<UserService, "resolveOrCreateTrialEnrollment">
  >

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
                publish: jest.fn(),
            } as unknown as jest.Mocked<
      Pick<EnqueueProcessGitSubmissionJobService, "enqueue" | "publish">
    >
            enqueueDocsV2 = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-docs-v2",
                }),
                publish: jest.fn(),
            } as unknown as jest.Mocked<
      Pick<EnqueueProcessGoogleDocsSubmissionJobService, "enqueue" | "publish">
    >

            // lane validation resolves the Auto lane
            gradingLaneValidationService = {
                validate: jest.fn().mockResolvedValue(autoLane),
            } as unknown as jest.Mocked<Pick<GradingLaneValidationService, "validate">>

            // advisory lock is a no-op in the unit test
            advisoryLock = {
                acquireUserChallengeSubmissionXactLock: jest.fn(),
            } as unknown as jest.Mocked<
      Pick<
        PostgreSqlAdvisoryLockService,
        "acquireUserChallengeSubmissionXactLock"
      >
    >

            // best-effort trial-enrollment resolution -- resolves null by default so
            // tests that never reach the enrollment step stay inert; tests that do
            // reach it override with mockResolvedValueOnce per-case
            userService = {
                resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue(null),
            } as unknown as jest.Mocked<
      Pick<UserService, "resolveOrCreateTrialEnrollment">
    >

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

            handler = module.get<SubmitChallengeSubmissionHandler>(
                SubmitChallengeSubmissionHandler,
            )
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
        it("blocks challenges owned by premium content before resolving a course",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-1",
                    })
                    .mockResolvedValueOnce({
                        id: "content-1",
                        isPremium: true,
                    })

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengePremiumLockedException)
                expect(userService.resolveOrCreateTrialEnrollment).not.toHaveBeenCalled()
            })
        it("enqueues Google Docs submissions and trims an updated URL",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GoogleDocsUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-1",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://docs.google.com/old",
                        enrollmentId: "enroll-1",
                    })
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://docs.google.com/new",
                        selectedLang: null,
                    })
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "ucs-1",
                    submissionUrl: "https://docs.google.com/new",
                    attempts: [],
                })
                const result = await handler.execute(
                    new SubmitChallengeSubmissionCommand({
                        request: {
                            challengeSubmissionId: "sub-1",
                            githubUrl: "  https://docs.google.com/new  ",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(enqueueDocsV2.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        challengeSubmissionId: "sub-1",
                    }),
                )
                expect(result).toEqual({
                    jobId: "job-docs-v2",
                })
                expect(enqueueGitV2.enqueue).not.toHaveBeenCalled()
            })
        it("rejects when grading quota is exhausted and reports the weekly reset",
            async () => {
                const entitlement = module.get(AiEntitlementService) as unknown as {
      snapshot: jest.Mock;
    }
                entitlement.snapshot.mockResolvedValueOnce({
                    credit: {
                        remaining5h: 5,
                        remainingWeek: 0,
                    },
                    windowWeekResetAt: new Date("2030-01-02T03:04:00.000Z"),
                    window5hResetAt: null,
                })
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-1",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                    })
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                        selectedLang: null,
                    })

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(SubmissionQuotaExceededException)
                expect(enqueueGitV2.enqueue).not.toHaveBeenCalled()
            })
        it("creates a first-time submission with its trial enrollment and enqueues grading",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-1",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "course-1",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "ucs-new",
                        submissionUrl: "https://github.com/me/repo",
                        selectedLang: null,
                    })
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "ucs-new",
                    submissionUrl: "https://github.com/me/repo",
                    attempts: [],
                })
                userService.resolveOrCreateTrialEnrollment.mockResolvedValueOnce({
                    id: "enroll-1",
                } as never)

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-1",
                                githubUrl: " https://github.com/me/repo ",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).resolves.toEqual({
                    jobId: "job-git-v2",
                })
                expect(entityManager.create).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        submissionUrl: "https://github.com/me/repo",
                        enrollment: {
                            id: "enroll-1",
                        },
                    }),
                )
            })

        it("reports a null reset time when the exhausted quota window has no reset",
            async () => {
                const entitlement = module.get(AiEntitlementService) as unknown as {
      snapshot: jest.Mock;
    }
                entitlement.snapshot.mockResolvedValueOnce({
                    credit: {
                        remaining5h: 0,
                        remainingWeek: 3,
                    },
                    window5hResetAt: null,
                    windowWeekResetAt: new Date("2030-01-02T03:04:00.000Z"),
                })
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-quota",
                        challengeId: "chal-quota",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-quota",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "ucs-quota",
                        submissionUrl: "https://github.com/me/repo",
                    })
                    .mockResolvedValueOnce({
                        id: "ucs-quota",
                        submissionUrl: "https://github.com/me/repo",
                        selectedLang: null,
                    })

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-quota",
                            },
                            user: fakeUser("user-quota"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(SubmissionQuotaExceededException)
                expect(enqueueGitV2.enqueue).not.toHaveBeenCalled()
            })
        it("backfills enrollment when an existing row receives a replacement URL",
            async () => {
                const existing: {
      id: string;
      submissionUrl: string;
      enrollmentId: string | null;
      enrollment?: {
        id: string;
      };
    } = {
        id: "ucs-1",
        submissionUrl: "https://github.com/old/repo",
        enrollmentId: null,
    }
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-1",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "course-1",
                    })
                    .mockResolvedValueOnce(existing)
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/new/repo",
                        selectedLang: null,
                    })
                entityManager.findOneOrFail.mockResolvedValueOnce(existing)
                userService.resolveOrCreateTrialEnrollment.mockResolvedValueOnce({
                    id: "enroll-1",
                } as never)

                await handler.execute(
                    new SubmitChallengeSubmissionCommand({
                        request: {
                            challengeSubmissionId: "sub-1",
                            githubUrl: "https://github.com/new/repo",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(existing.submissionUrl).toBe("https://github.com/new/repo")
                expect(existing.enrollment).toEqual({
                    id: "enroll-1",
                })
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.anything(),
                    existing,
                )
            })
        it("fails when the transaction result disappears before the final reload",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-1",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                    })
                    .mockResolvedValueOnce(null)
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "ucs-1",
                    submissionUrl: "https://github.com/me/repo",
                })

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserChallengeSubmissionNotFoundException)
                expect(enqueueGitV2.enqueue).not.toHaveBeenCalled()
            })
        it("rejects an existing row whose persisted URL is blank",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-1",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "   ",
                    })
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "   ",
                        selectedLang: null,
                    })
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "ucs-1",
                    submissionUrl: "   ",
                })

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
                expect(enqueueGitV2.enqueue).not.toHaveBeenCalled()
            })

        it("propagates a submission lookup failure before entering the grading transaction",
            async () => {
                const lookupError = new Error("database unavailable")
                entityManager.findOne.mockRejectedValueOnce(lookupError)

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBe(lookupError)
                expect(entityManager.transaction).not.toHaveBeenCalled()
                expect(enqueueGitV2.enqueue).not.toHaveBeenCalled()
            })

        it("propagates grading-lane validation failures before queueing work",
            async () => {
                const failure = new Error("grading lane unavailable")
                gradingLaneValidationService.validate.mockRejectedValueOnce(failure)
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "sub-1",
                        challengeId: "chal-1",
                        type: SubmissionType.GithubUrl,
                    })
                    .mockResolvedValueOnce({
                        id: "chal-1",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                    })
                    .mockResolvedValueOnce({
                        id: "ucs-1",
                        submissionUrl: "https://github.com/me/repo",
                    })

                await expect(
                    handler.execute(
                        new SubmitChallengeSubmissionCommand({
                            request: {
                                challengeSubmissionId: "sub-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBe(failure)
                expect(enqueueGitV2.enqueue).not.toHaveBeenCalled()
                expect(enqueueDocsV2.enqueue).not.toHaveBeenCalled()
            })

        it("commits every authored deliverable and durable job in one aggregate transaction",
            async () => {
                const githubSubmission = {
                    id: "sub-git",
                    challengeId: "challenge-1",
                    challenge: {
                        id: "challenge-1",
                    },
                    type: SubmissionType.GithubUrl,
                }
                const docsSubmission = {
                    id: "sub-docs",
                    challengeId: "challenge-1",
                    challenge: {
                        id: "challenge-1",
                    },
                    type: SubmissionType.GoogleDocsUrl,
                }
                entityManager.find
                    .mockResolvedValueOnce([githubSubmission,
                        docsSubmission])
                    .mockResolvedValueOnce([
                        {
                            id: "sub-git",
                        },
                        {
                            id: "sub-docs",
                        },
                    ])
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "challenge-1",
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "course-1",
                    })
                    .mockResolvedValueOnce({
                        id: "user-sub-git",
                        submissionUrl: "https://github.com/me/repo",
                        draftRevision: 2,
                        selectedLang: null,
                        enrollmentId: null,
                    })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "user-sub-docs",
                        submissionUrl: "https://docs.google.com/document/d/1",
                        draftRevision: 4,
                        selectedLang: null,
                        enrollmentId: null,
                    })
                    .mockResolvedValueOnce(null)
                entityManager.save.mockImplementation(
                    async (_target: unknown, value?: unknown) => {
                        const record = value as { idempotencyKey?: string } | undefined
                        return record?.idempotencyKey
                            ? {
                                ...record,
                                id: `attempt-${record.idempotencyKey}`,
                            }
                            : value
                    },
                )
                enqueueGitV2.enqueue.mockImplementation(
                    async (params) =>
        ({
            id: params.reservedJobId,
        }) as never,
                )
                enqueueDocsV2.enqueue.mockImplementation(
                    async (params) =>
        ({
            id: params.reservedJobId,
        }) as never,
                )

                const result = await handler.execute(
                    new SubmitChallengeSubmissionCommand({
                        request: {
                            challengeSubmissionId: "sub-git",
                            attemptGroupId: "8ed3d15c-f263-4dc8-8ac4-d21693572663",
                            deliverables: [
                                {
                                    challengeSubmissionId: "sub-git",
                                    idempotencyKey: "job-git",
                                },
                                {
                                    challengeSubmissionId: "sub-docs",
                                    idempotencyKey: "job-docs",
                                },
                            ],
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(entityManager.transaction).toHaveBeenCalledTimes(1)
                expect(enqueueGitV2.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        reservedJobId: "job-git",
                        deferPublish: true,
                        entityManager,
                    }),
                )
                expect(enqueueDocsV2.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        reservedJobId: "job-docs",
                        deferPublish: true,
                        entityManager,
                    }),
                )
                expect(enqueueGitV2.publish).toHaveBeenCalledTimes(1)
                expect(enqueueDocsV2.publish).toHaveBeenCalledTimes(1)
                expect(result).toEqual({
                    jobId: "job-git",
                    attemptId: "attempt-job-git",
                    attemptGroupId: "8ed3d15c-f263-4dc8-8ac4-d21693572663",
                    items: [
                        {
                            challengeSubmissionId: "sub-git",
                            jobId: "job-git",
                            attemptId: "attempt-job-git",
                        },
                        {
                            challengeSubmissionId: "sub-docs",
                            jobId: "job-docs",
                            attemptId: "attempt-job-docs",
                        },
                    ],
                })
            })
    })
