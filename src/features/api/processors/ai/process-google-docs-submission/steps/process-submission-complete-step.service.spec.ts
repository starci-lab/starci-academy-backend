import {
    QueryFailedError,
} from "typeorm"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/platform/exceptions/errors/ai/missing-or-invalid-grade-execution-result"
import {
    JobFencedOutException,
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    SubmissionOwnerMissingException,
} from "@modules/platform/exceptions/errors/submission-review/submission-owner-missing"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    writeActivity,
} from "@modules/bussiness/activity/write-activity"
import {
    enqueueSubmissionResultEmail,
} from "@modules/integrations/transactional-email/submission-result-email"
import {
    writeXpHistory,
} from "../../shared/xp/write-xp-history"
import {
    ProcessGoogleDocsSubmissionCompleteStepService,
} from "./process-submission-complete-step.service"

jest.mock("../../shared/xp/write-xp-history",
    () => ({
        writeXpHistory: jest.fn(),
    }))

jest.mock("@modules/bussiness/activity/write-activity",
    () => ({
        writeActivity: jest.fn(),
    }))

jest.mock("@modules/integrations/transactional-email/submission-result-email",
    () => ({
        enqueueSubmissionResultEmail: jest.fn(),
    }))

/** Postgres unique-violation SQLSTATE the step treats as "already graded". */
const PG_UNIQUE_VIOLATION = "23505"

/** Fixed instant the stubbed clock stamps onto the attempt. */
const PROCESSED_AT = new Date("2026-05-04T09:00:00.000Z")

/** Params the mocked `loadExecutionResult` is invoked with. */
interface LoadExecutionResultParams {
    /** Execution-result key being read ("grade" or "creditCharged"). */
    key: string
}

/** Build a grade result as the grade step would have persisted it. */
const makeGrade = (
    overrides: Record<string, unknown> = {
    },
) => ({
    evaluation: {
        score: 82,
        shortFeedback: "solid write-up",
        details: [
            {
                feedbacks: [
                    {
                        message: "missing sequence diagram",
                        severity: "major",
                        location: "section 2",
                        suggestion: "add one",
                    },
                    {
                        message: "typo",
                        severity: "minor",
                        location: "section 3",
                        suggestion: "fix it",
                    },
                ],
            },
            {
                feedbacks: [
                    {
                        message: "no failure modes",
                        severity: "major",
                        location: "section 5",
                        suggestion: "list them",
                    },
                ],
            },
        ],
    },
    passed: true,
    aiUsage: {
        model: "gemini-2.5-pro",
        provider: "google",
        promptTokens: 1200,
        completionTokens: 300,
        cachedTokens: 100,
        attempts: 1,
    },
    ...overrides,
})

describe("ProcessGoogleDocsSubmissionCompleteStepService",
    () => {
        let entityManager: EntityManagerMock
        let jobActionService: {
            loadExecutionResult: jest.Mock
            increaseJob: jest.Mock
            saveExecutionResult: jest.Mock
        }
        let winstonService: { log: jest.Mock }
        let eventEmitterService: { emit: jest.Mock }
        let aiEntitlementService: { consume: jest.Mock }
        let aiModelCatalogService: { creditForRun: jest.Mock }
        let progressProjectionService: { recompute: jest.Mock }
        let challengeProgressService: { invalidateProgress: jest.Mock }
        let enqueueSendMailJobService: { enqueue: jest.Mock }
        let notificationService: { createNotification: jest.Mock }
        let service: ProcessGoogleDocsSubmissionCompleteStepService

        /** The enrollment the passed-branch resolves for the XP grant. */
        const enrollmentRow = {
            id: "enroll-1",
            userId: "user-1",
            courseId: "course-1",
        }

        /** The submission row carrying the graded challenge. */
        const submissionRow = {
            id: "ucs-1",
            userId: "user-1",
            submission: {
                challenge: {
                    id: "challenge-1",
                    title: "Design a rate limiter",
                },
            },
        }

        /** Overrides `makeContext` accepts to steer one field of the built job context. */
        interface MakeContextOverrides {
            /** `null` models a job row that never got an id. */
            jobId?: string | null
            locale?: Locale
            /** When true, the worker never attached the extended context. */
            withoutExtended?: boolean
        }

        /** Build the job context the step reads. */
        const makeContext = (
            overrides: MakeContextOverrides = {
            },
        ) => ({
            job: {
                id: overrides.jobId === null ? undefined : overrides.jobId ?? "job-1",
                fencingToken: 7,
            },
            queueName: "process-google-docs-submission",
            payload: {
                userChallengeSubmissionId: "ucs-1",
                enrollmentId: "enroll-1",
                locale: overrides.locale,
            },
            extended: overrides.withoutExtended
                ? undefined
                : {
                    userChallengeSubmission: {
                        submissionUrl: "https://docs.google.com/document/d/abc",
                    },
                },
        })

        /** Point every entity read at the happy-path rows. */
        const programHappyReads = (): void => {
            entityManager.findOne.mockImplementation(async (entity: unknown) => {
                if (entity === EnrollmentEntity) {
                    return enrollmentRow
                }
                if (entity === UserChallengeSubmissionEntity) {
                    return submissionRow
                }
                // no attempt yet for this idempotency key
                return null
            })
            entityManager.findOneOrFail.mockResolvedValue(submissionRow)
            entityManager.count.mockResolvedValue(2)
            entityManager.save.mockImplementation(
                async (_entity: unknown, data: Record<string, unknown>) => ({
                    id: "attempt-1",
                    ...data,
                }),
            )
        }

        beforeEach(() => {
            jest.clearAllMocks()
            entityManager = makeEntityManagerMock()
            jobActionService = {
                loadExecutionResult: jest.fn().mockImplementation(
                    async ({ key }: LoadExecutionResultParams) => (
                        key === "grade" ? makeGrade() : undefined
                    ),
                ),
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
            }
            winstonService = {
                log: jest.fn(),
            }
            eventEmitterService = {
                emit: jest.fn(),
            }
            aiEntitlementService = {
                consume: jest.fn(),
            }
            aiModelCatalogService = {
                creditForRun: jest.fn().mockResolvedValue(17),
            }
            progressProjectionService = {
                recompute: jest.fn(),
            }
            challengeProgressService = {
                invalidateProgress: jest.fn(),
            }
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            }
            notificationService = {
                createNotification: jest.fn(),
            }
            programHappyReads()
            service = new ProcessGoogleDocsSubmissionCompleteStepService(
                entityManager as never,
                jobActionService as never,
                winstonService as never,
                eventEmitterService as never,
                {
                    now: () => ({
                        toDate: () => PROCESSED_AT,
                    }),
                } as never,
                aiEntitlementService as never,
                aiModelCatalogService as never,
                progressProjectionService as never,
                challengeProgressService as never,
                enqueueSendMailJobService as never,
                notificationService as never,
            )
        })

        describe("grade validation",
            () => {
                it("throws when the grade step left no execution result",
                    async () => {
                        jobActionService.loadExecutionResult.mockResolvedValue(undefined)

                        await expect(service.process(makeContext() as never)).rejects.toBeInstanceOf(
                            MissingOrInvalidGradeExecutionResultException,
                        )
                        expect(entityManager.transaction).not.toHaveBeenCalled()
                    })

                it("throws when the stored grade carries no evaluation object",
                    async () => {
                        jobActionService.loadExecutionResult.mockImplementation(
                            async ({ key }: LoadExecutionResultParams) => (
                                key === "grade"
                                    ? makeGrade({
                                        evaluation: "not-an-object",
                                    })
                                    : undefined
                            ),
                        )

                        await expect(service.process(makeContext() as never)).rejects.toBeInstanceOf(
                            MissingOrInvalidGradeExecutionResultException,
                        )
                    })

                it("throws when the stored grade carries a non-boolean pass flag",
                    async () => {
                        jobActionService.loadExecutionResult.mockImplementation(
                            async ({ key }: LoadExecutionResultParams) => (
                                key === "grade"
                                    ? makeGrade({
                                        passed: "yes",
                                    })
                                    : undefined
                            ),
                        )

                        await expect(service.process(makeContext() as never)).rejects.toBeInstanceOf(
                            MissingOrInvalidGradeExecutionResultException,
                        )
                    })
            })

        describe("the graded attempt",
            () => {
                it("persists one attempt keyed by the job id, with flattened feedbacks and model attribution",
                    async () => {
                        await service.process(makeContext() as never)

                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserChallengeSubmissionAttemptEntity,
                            {
                                idempotencyKey: "job-1",
                                userChallengeSubmission: {
                                    id: "ucs-1",
                                },
                                submissionUrl: "https://docs.google.com/document/d/abc",
                                processedAt: PROCESSED_AT,
                                score: 82,
                                shortFeedback: "solid write-up",
                                // 2 existing attempts -> this is the third
                                attemptNumber: 3,
                                servedModel: "gemini-2.5-pro",
                                servedProvider: "google",
                                promptTokens: 1200,
                                completionTokens: 300,
                                defaultLocale: Locale.En,
                                feedbacks: [
                                    {
                                        message: "missing sequence diagram",
                                        severity: "major",
                                        location: "section 2",
                                        suggestion: "add one",
                                        orderIndex: 0,
                                        defaultLocale: Locale.En,
                                    },
                                    {
                                        message: "typo",
                                        severity: "minor",
                                        location: "section 3",
                                        suggestion: "fix it",
                                        orderIndex: 1,
                                        defaultLocale: Locale.En,
                                    },
                                    {
                                        // the second detail's feedback keeps counting up
                                        message: "no failure modes",
                                        severity: "major",
                                        location: "section 5",
                                        suggestion: "list them",
                                        orderIndex: 2,
                                        defaultLocale: Locale.En,
                                    },
                                ],
                            },
                        )
                    })

                it("advances the step under the fencing guard and stores the step result atomically",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        expect(entityManager.transaction).toHaveBeenCalledTimes(1)
                        expect(jobActionService.increaseJob).toHaveBeenCalledWith({
                            job: context.job,
                            entityManager,
                            expectedFencingToken: 7,
                        })
                        expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith({
                            job: context.job,
                            key: "complete",
                            executionResult: {
                            },
                            entityManager,
                        })
                    })

                it("honours the payload locale for the attempt and its feedbacks",
                    async () => {
                        await service.process(makeContext({
                            locale: Locale.Vi,
                        }) as never)

                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserChallengeSubmissionAttemptEntity,
                            expect.objectContaining({
                                defaultLocale: Locale.Vi,
                                feedbacks: expect.arrayContaining([
                                    expect.objectContaining({
                                        defaultLocale: Locale.Vi,
                                    }),
                                ]),
                            }),
                        )
                    })

                it("records an empty submission url when the worker attached no extended context",
                    async () => {
                        await service.process(makeContext({
                            withoutExtended: true,
                        }) as never)

                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserChallengeSubmissionAttemptEntity,
                            expect.objectContaining({
                                submissionUrl: "",
                            }),
                        )
                    })

                it("nulls every model-attribution field when the grade carried no AI usage",
                    async () => {
                        jobActionService.loadExecutionResult.mockImplementation(
                            async ({ key }: LoadExecutionResultParams) => (
                                key === "grade"
                                    ? makeGrade({
                                        aiUsage: undefined,
                                    })
                                    : undefined
                            ),
                        )

                        await service.process(makeContext() as never)

                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserChallengeSubmissionAttemptEntity,
                            expect.objectContaining({
                                servedModel: null,
                                servedProvider: null,
                                promptTokens: null,
                                completionTokens: null,
                            }),
                        )
                        // with no model there is nothing to price, so the catalog is not consulted
                        expect(aiModelCatalogService.creditForRun).not.toHaveBeenCalled()
                        expect(aiEntitlementService.consume).toHaveBeenCalledWith(
                            expect.objectContaining({
                                cost: 0,
                                model: null,
                                provider: null,
                            }),
                        )
                    })
            })

        describe("the passed-challenge reward",
            () => {
                it("grants XP, writes the home-feed activity and refreshes the progress projection",
                    async () => {
                        await service.process(makeContext() as never)

                        expect(writeXpHistory).toHaveBeenCalledWith({
                            entityManager,
                            userId: "user-1",
                            courseId: "course-1",
                            source: XpSource.Challenge,
                            amount: 82,
                            points: expect.any(Number),
                            refId: "attempt-1",
                        })
                        expect(writeActivity).toHaveBeenCalledWith({
                            entityManager,
                            userId: "user-1",
                            type: ActivityType.ChallengePassed,
                            idempotencyKey: "challengePassed:user-1:challenge-1",
                            metadata: {
                                target: {
                                    entityName: "ChallengeEntity",
                                    id: "challenge-1",
                                    label: "Design a rate limiter",
                                },
                            },
                        })
                        expect(progressProjectionService.recompute).toHaveBeenCalledWith({
                            userId: "user-1",
                            courseId: "course-1",
                            entityManager,
                        })
                    })

                it("grants nothing when the challenge was not passed",
                    async () => {
                        jobActionService.loadExecutionResult.mockImplementation(
                            async ({ key }: LoadExecutionResultParams) => (
                                key === "grade"
                                    ? makeGrade({
                                        passed: false,
                                    })
                                    : undefined
                            ),
                        )

                        await service.process(makeContext() as never)

                        expect(writeXpHistory).not.toHaveBeenCalled()
                        expect(writeActivity).not.toHaveBeenCalled()
                        expect(progressProjectionService.recompute).not.toHaveBeenCalled()
                        // the attempt is still persisted and the step still advances
                        expect(entityManager.save).toHaveBeenCalled()
                        expect(jobActionService.increaseJob).toHaveBeenCalled()
                    })

                it("skips the whole reward when the enrollment row cannot be resolved",
                    async () => {
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === UserChallengeSubmissionEntity) {
                                return submissionRow
                            }
                            // no attempt, and no enrollment either
                            return null
                        })

                        await service.process(makeContext() as never)

                        expect(writeXpHistory).not.toHaveBeenCalled()
                        expect(progressProjectionService.recompute).not.toHaveBeenCalled()
                        expect(jobActionService.increaseJob).toHaveBeenCalled()
                    })

                it("still grants XP but writes no activity when the challenge cannot be resolved",
                    async () => {
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === EnrollmentEntity) {
                                return enrollmentRow
                            }
                            if (entity === UserChallengeSubmissionEntity) {
                                // the submission exists but its challenge relation is empty
                                return {
                                    id: "ucs-1",
                                    submission: null,
                                }
                            }
                            return null
                        })

                        await service.process(makeContext() as never)

                        expect(writeXpHistory).toHaveBeenCalled()
                        expect(writeActivity).not.toHaveBeenCalled()
                        expect(progressProjectionService.recompute).toHaveBeenCalled()
                    })
            })

        describe("the after-commit credit charge",
            () => {
                it("debits the catalog credit for the model that actually served",
                    async () => {
                        await service.process(makeContext() as never)

                        expect(aiModelCatalogService.creditForRun).toHaveBeenCalledWith({
                            name: "gemini-2.5-pro",
                            promptTokens: 1200,
                            completionTokens: 300,
                            cachedTokens: 100,
                            fallback: expect.any(Number),
                        })
                        expect(aiEntitlementService.consume).toHaveBeenCalledWith({
                            userId: "user-1",
                            cost: 17,
                            surface: AiCeilSurface.Grading,
                            task: AiModelTask.ChallengeGrading,
                            model: "gemini-2.5-pro",
                            provider: "google",
                            recommendation: null,
                            promptTokens: 1200,
                            completionTokens: 300,
                            attempts: 1,
                        })
                    })

                it("does not double-charge when the grade step already debited up front",
                    async () => {
                        jobActionService.loadExecutionResult.mockImplementation(
                            async ({ key }: LoadExecutionResultParams) => (
                                key === "grade" ? makeGrade() : true
                            ),
                        )

                        await service.process(makeContext() as never)

                        expect(aiEntitlementService.consume).not.toHaveBeenCalled()
                        // the rest of the after-commit work still runs
                        expect(challengeProgressService.invalidateProgress).toHaveBeenCalled()
                    })

                it("rejects when the graded submission has no owner to charge",
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValue({
                            id: "ucs-1",
                            userId: null,
                        })

                        await expect(service.process(makeContext() as never)).rejects.toBeInstanceOf(
                            SubmissionOwnerMissingException,
                        )
                        expect(aiEntitlementService.consume).not.toHaveBeenCalled()
                    })
            })

        describe("idempotency and fencing",
            () => {
                it("does nothing inside the transaction when an attempt for this job already exists",
                    async () => {
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === UserChallengeSubmissionAttemptEntity) {
                                return {
                                    id: "attempt-existing",
                                }
                            }
                            return submissionRow
                        })

                        await service.process(makeContext() as never)

                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(jobActionService.increaseJob).not.toHaveBeenCalled()
                        expect(aiEntitlementService.consume).not.toHaveBeenCalled()
                        expect(enqueueSubmissionResultEmail).not.toHaveBeenCalled()
                        expect(notificationService.createNotification).not.toHaveBeenCalled()
                        // the cache drop + event still fire so a duplicate run self-heals the read side
                        expect(challengeProgressService.invalidateProgress).toHaveBeenCalledWith("enroll-1")
                        expect(eventEmitterService.emit).toHaveBeenCalled()
                    })

                it("swallows the unique-violation a concurrent duplicate lost the race on",
                    async () => {
                        entityManager.transaction.mockRejectedValue(new QueryFailedError(
                            "INSERT INTO user_challenge_submission_attempts ...",
                            [],
                            Object.assign(
                                new Error("duplicate key value violates unique constraint"),
                                {
                                    code: PG_UNIQUE_VIOLATION,
                                },
                            ),
                        ))

                        await expect(service.process(makeContext() as never)).resolves.toBeUndefined()

                        // it returns immediately -- no charge, no log, no email
                        expect(aiEntitlementService.consume).not.toHaveBeenCalled()
                        expect(winstonService.log).not.toHaveBeenCalled()
                        expect(challengeProgressService.invalidateProgress).not.toHaveBeenCalled()
                    })

                it("rethrows a QueryFailedError carrying a different SQLSTATE",
                    async () => {
                        const otherError = new QueryFailedError(
                            "INSERT INTO user_challenge_submission_attempts ...",
                            [],
                            Object.assign(
                                new Error("not-null violation"),
                                {
                                    code: "23502",
                                },
                            ),
                        )
                        entityManager.transaction.mockRejectedValue(otherError)

                        await expect(service.process(makeContext() as never)).rejects.toBe(otherError)
                    })

                it("rethrows a QueryFailedError whose driver error carries no code at all",
                    async () => {
                        const codelessError = new QueryFailedError(
                            "INSERT INTO user_challenge_submission_attempts ...",
                            [],
                            new Error("connection terminated"),
                        )
                        entityManager.transaction.mockRejectedValue(codelessError)

                        await expect(service.process(makeContext() as never)).rejects.toBe(codelessError)
                    })

                it("returns quietly when a newer worker fenced this one out",
                    async () => {
                        entityManager.transaction.mockRejectedValue(new JobFencedOutException({
                            id: "job-1",
                            expectedFencingToken: 7,
                        }))

                        await expect(service.process(makeContext() as never)).resolves.toBeUndefined()

                        expect(aiEntitlementService.consume).not.toHaveBeenCalled()
                        expect(enqueueSubmissionResultEmail).not.toHaveBeenCalled()
                    })

                it("rethrows any other transaction failure",
                    async () => {
                        const failure = new Error("deadlock detected")
                        entityManager.transaction.mockRejectedValue(failure)

                        await expect(service.process(makeContext() as never)).rejects.toBe(failure)
                    })
            })

        describe("after-commit side effects",
            () => {
                it("logs the step, drops the cached progress and announces the update",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.ProcessGitSubmissionStepExecuted,
                            {
                                jobId: "job-1",
                                queueName: "process-google-docs-submission",
                                step: "complete",
                                stepIndex: 1,
                                payload: context.payload,
                                success: true,
                            },
                        )
                        expect(challengeProgressService.invalidateProgress).toHaveBeenCalledWith("enroll-1")
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.ChallengeSubmissionProgressUpdated,
                            payload: {
                                enrollmentId: "enroll-1",
                            },
                        })
                    })

                it("reports an absent job id as an empty string in the step log",
                    async () => {
                        await service.process(makeContext({
                            jobId: null,
                        }) as never)

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.ProcessGitSubmissionStepExecuted,
                            expect.objectContaining({
                                jobId: "",
                            }),
                        )
                    })

                it("emails the learner their result and raises a graded notification",
                    async () => {
                        await service.process(makeContext() as never)

                        expect(enqueueSubmissionResultEmail).toHaveBeenCalledWith({
                            entityManager,
                            enqueueSendMailJobService,
                            userChallengeSubmissionId: "ucs-1",
                            score: 82,
                            feedback: "solid write-up",
                            webBaseUrl: expect.any(String),
                            locale: undefined,
                        })
                        expect(notificationService.createNotification).toHaveBeenCalledWith({
                            userId: "user-1",
                            type: NotificationType.ChallengeGraded,
                            title: {
                                key: "notification.challengeGraded.title",
                                params: {
                                    title: "Design a rate limiter",
                                    result: "passed",
                                },
                            },
                            target: {
                                entityName: "ChallengeEntity",
                                id: "challenge-1",
                                label: "Design a rate limiter",
                            },
                        })
                    })

                it("says failed and drops the deep-link target when the challenge is unresolvable",
                    async () => {
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === EnrollmentEntity) {
                                return enrollmentRow
                            }
                            if (entity === UserChallengeSubmissionEntity) {
                                return null
                            }
                            return null
                        })
                        jobActionService.loadExecutionResult.mockImplementation(
                            async ({ key }: LoadExecutionResultParams) => (
                                key === "grade"
                                    ? makeGrade({
                                        passed: false,
                                    })
                                    : undefined
                            ),
                        )

                        await service.process(makeContext() as never)

                        expect(notificationService.createNotification).toHaveBeenCalledWith({
                            userId: "user-1",
                            type: NotificationType.ChallengeGraded,
                            title: {
                                key: "notification.challengeGraded.title",
                                params: {
                                    title: "",
                                    result: "failed",
                                },
                            },
                            target: undefined,
                        })
                    })

                it("logs and swallows a notification failure so the committed grading still succeeds",
                    async () => {
                        notificationService.createNotification.mockRejectedValue(
                            new Error("notification store down"),
                        )
                        const context = makeContext()

                        await expect(service.process(context as never)).resolves.toBeUndefined()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.ProcessGitSubmissionStepExecuted,
                            {
                                jobId: "job-1",
                                queueName: "process-google-docs-submission",
                                step: "complete",
                                stepIndex: 1,
                                payload: context.payload,
                                success: false,
                                error: "notification store down",
                            },
                        )
                    })

                it("stringifies a non-Error notification failure and reports an absent job id as empty",
                    async () => {
                        notificationService.createNotification.mockRejectedValue("bell exploded")

                        await service.process(makeContext({
                            jobId: null,
                        }) as never)

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.ProcessGitSubmissionStepExecuted,
                            expect.objectContaining({
                                jobId: "",
                                success: false,
                                error: "bell exploded",
                            }),
                        )
                    })
            })
    })
