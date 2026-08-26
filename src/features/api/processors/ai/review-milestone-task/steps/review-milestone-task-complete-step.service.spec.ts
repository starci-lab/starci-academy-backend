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
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    UserMilestoneTaskAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-milestone-task-attempt.entity"
import {
    UserMilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/user-milestone-task.entity"
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
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    writeActivity,
} from "@modules/bussiness/activity/write-activity"
import {
    enqueueLearnerEmail,
} from "@modules/integrations/transactional-email/enqueue-learner-email"
import {
    writeXpHistory,
} from "../../shared/xp/write-xp-history"
import {
    ReviewMilestoneTaskCompleteStepService,
} from "./review-milestone-task-complete-step.service"

jest.mock("../../shared/xp/write-xp-history",
    () => ({
        writeXpHistory: jest.fn(),
    }))

jest.mock("@modules/bussiness/activity/write-activity",
    () => ({
        writeActivity: jest.fn(),
    }))

jest.mock("@modules/integrations/transactional-email/enqueue-learner-email",
    () => ({
        enqueueLearnerEmail: jest.fn(),
    }))

/** Postgres unique-violation SQLSTATE the step treats as "already reviewed". */
const PG_UNIQUE_VIOLATION = "23505"

/** Fixed instant the stubbed clock stamps onto the attempt. */
const PROCESSED_AT = new Date("2026-05-04T09:00:00.000Z")

/** Params the mocked `loadExecutionResult` is invoked with. */
interface LoadExecutionResultParams {
    /** Execution-result key being read. */
    key: string
}

/** Build a grade result as the grade step would have persisted it. */
const makeGrade = (
    overrides: Record<string, unknown> = {
    },
) => ({
    evaluation: {
        score: 91,
        shortFeedback: "clean architecture",
        details: [
            {
                feedbacks: [
                    {
                        message: "no tests",
                        severity: "major",
                        location: "src/",
                        suggestion: "add unit tests",
                    },
                    {
                        message: "unused import",
                        severity: "minor",
                        location: "src/app.ts",
                        suggestion: "remove it",
                    },
                ],
            },
        ],
    },
    passed: true,
    aiUsage: {
        model: "claude-sonnet",
        provider: "anthropic",
        promptTokens: 900,
        completionTokens: 210,
        cachedTokens: 40,
        attempts: 2,
    },
    ...overrides,
})

describe("ReviewMilestoneTaskCompleteStepService",
    () => {
        let entityManager: EntityManagerMock
        let jobActionService: {
            loadExecutionResult: jest.Mock
            increaseJob: jest.Mock
            saveExecutionResult: jest.Mock
        }
        let winstonService: { log: jest.Mock }
        let eventEmitterService: { emit: jest.Mock }
        let progressProjectionService: { recompute: jest.Mock }
        let enqueueSendMailJobService: { enqueue: jest.Mock }
        let creditService: { consume: jest.Mock }
        let aiModelCatalogService: { creditForRun: jest.Mock }
        let notificationService: { createNotification: jest.Mock }
        let service: ReviewMilestoneTaskCompleteStepService

        /** The enrollment resolved for both the debit and the XP grant. */
        const enrollmentRow = {
            id: "enroll-1",
            userId: "user-1",
            courseId: "course-1",
        }

        /** The milestone task the attempt belongs to. */
        const milestoneTaskRow = {
            id: "task-1",
            title: "Ship the auth module",
        }

        /** An existing user-milestone-task row. */
        const userMilestoneTaskRow = {
            id: "umt-1",
        }

        /** Overrides `makeContext` accepts to steer one field of the built job context. */
        interface MakeContextOverrides {
            /** `null` models a job row that never got an id. */
            jobId?: string | null
            locale?: Locale
        }

        /** Build the job context the step reads. */
        const makeContext = (
            overrides: MakeContextOverrides = {
            },
        ) => ({
            job: {
                id: overrides.jobId === null ? undefined : overrides.jobId ?? "job-1",
                fencingToken: 4,
            },
            queueName: "review-milestone-task",
            payload: {
                enrollmentId: "enroll-1",
                taskId: "task-1",
                locale: overrides.locale,
            },
            extended: {
            },
        })

        /** Point every entity read at the happy-path rows. */
        const programHappyReads = (): void => {
            entityManager.findOne.mockImplementation(async (entity: unknown) => {
                if (entity === UserMilestoneTaskEntity) {
                    return userMilestoneTaskRow
                }
                if (entity === EnrollmentEntity) {
                    return enrollmentRow
                }
                if (entity === MilestoneTaskEntity) {
                    return milestoneTaskRow
                }
                // no attempt yet for this idempotency key
                return null
            })
            entityManager.findOneOrFail.mockResolvedValue(enrollmentRow)
            entityManager.count.mockResolvedValue(1)
            entityManager.save.mockImplementation(
                async (target: unknown, data?: Record<string, unknown>) => {
                    // single-argument save persists an entity instance in place
                    if (data === undefined) {
                        const entity = target as Record<string, unknown>
                        entity.id = entity.id ?? "umt-created"
                        return entity
                    }
                    return {
                        id: "attempt-1",
                        ...data,
                    }
                },
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
            progressProjectionService = {
                recompute: jest.fn(),
            }
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            }
            creditService = {
                consume: jest.fn(),
            }
            aiModelCatalogService = {
                creditForRun: jest.fn().mockResolvedValue(23),
            }
            notificationService = {
                createNotification: jest.fn(),
            }
            programHappyReads()
            service = new ReviewMilestoneTaskCompleteStepService(
                entityManager as never,
                jobActionService as never,
                winstonService as never,
                {
                    stepName: "grade",
                } as never,
                eventEmitterService as never,
                {
                    now: () => ({
                        toDate: () => PROCESSED_AT,
                    }),
                } as never,
                progressProjectionService as never,
                enqueueSendMailJobService as never,
                creditService as never,
                aiModelCatalogService as never,
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
                        jobActionService.loadExecutionResult.mockResolvedValue(makeGrade({
                            evaluation: 42,
                        }))

                        await expect(service.process(makeContext() as never)).rejects.toBeInstanceOf(
                            MissingOrInvalidGradeExecutionResultException,
                        )
                    })

                it("throws when the stored grade carries a non-boolean pass flag",
                    async () => {
                        jobActionService.loadExecutionResult.mockResolvedValue(makeGrade({
                            passed: null,
                        }))

                        await expect(service.process(makeContext() as never)).rejects.toBeInstanceOf(
                            MissingOrInvalidGradeExecutionResultException,
                        )
                    })

                it("reads the grade result under the grade step's own key",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        expect(jobActionService.loadExecutionResult).toHaveBeenCalledWith({
                            job: context.job,
                            key: "grade",
                        })
                    })
            })

        describe("the reviewed attempt",
            () => {
                it("persists one attempt keyed by the job id, with flattened feedbacks and model attribution",
                    async () => {
                        await service.process(makeContext() as never)

                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserMilestoneTaskAttemptEntity,
                            {
                                idempotencyKey: "job-1",
                                userMilestoneTask: {
                                    id: "umt-1",
                                },
                                processedAt: PROCESSED_AT,
                                score: 91,
                                shortFeedback: "clean architecture",
                                passed: true,
                                // one prior attempt -> this is the second
                                attemptNumber: 2,
                                servedModel: "claude-sonnet",
                                servedProvider: "anthropic",
                                promptTokens: 900,
                                completionTokens: 210,
                                defaultLocale: Locale.En,
                                feedbacks: [
                                    {
                                        message: "no tests",
                                        severity: "major",
                                        location: "src/",
                                        suggestion: "add unit tests",
                                        orderIndex: 0,
                                        defaultLocale: Locale.En,
                                    },
                                    {
                                        message: "unused import",
                                        severity: "minor",
                                        location: "src/app.ts",
                                        suggestion: "remove it",
                                        orderIndex: 1,
                                        defaultLocale: Locale.En,
                                    },
                                ],
                            },
                        )
                    })

                it("creates the user-milestone-task row the first time the learner is reviewed",
                    async () => {
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === EnrollmentEntity) {
                                return enrollmentRow
                            }
                            if (entity === MilestoneTaskEntity) {
                                return milestoneTaskRow
                            }
                            // neither an attempt nor a user-milestone-task exists yet
                            return null
                        })

                        await service.process(makeContext() as never)

                        // objectContaining, because the subsequent save stamps the
                        // generated id onto this same instance (as TypeORM does)
                        expect(entityManager.create).toHaveBeenCalledWith(
                            UserMilestoneTaskEntity,
                            expect.objectContaining({
                                enrollment: {
                                    id: "enroll-1",
                                },
                                milestoneTask: {
                                    id: "task-1",
                                },
                            }),
                        )
                        // the attempt hangs off the freshly created row
                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserMilestoneTaskAttemptEntity,
                            expect.objectContaining({
                                userMilestoneTask: {
                                    id: "umt-created",
                                },
                            }),
                        )
                    })

                it("honours the payload locale for the attempt and its feedbacks",
                    async () => {
                        await service.process(makeContext({
                            locale: Locale.Vi,
                        }) as never)

                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserMilestoneTaskAttemptEntity,
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

                it("advances the step under the fencing guard and stores the step result atomically",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        expect(entityManager.transaction).toHaveBeenCalledTimes(1)
                        expect(jobActionService.increaseJob).toHaveBeenCalledWith({
                            job: context.job,
                            entityManager,
                            expectedFencingToken: 4,
                        })
                        expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith({
                            job: context.job,
                            key: "complete",
                            executionResult: {
                            },
                            entityManager,
                        })
                    })
            })

        describe("the credit debit",
            () => {
                it("prices the run through the catalog and debits on the grading transaction",
                    async () => {
                        await service.process(makeContext() as never)

                        expect(aiModelCatalogService.creditForRun).toHaveBeenCalledWith({
                            name: "claude-sonnet",
                            promptTokens: 900,
                            completionTokens: 210,
                            cachedTokens: 40,
                            fallback: expect.any(Number),
                        })
                        expect(creditService.consume).toHaveBeenCalledWith(
                            entityManager,
                            {
                                userId: "user-1",
                                cost: 23,
                                surface: AiCeilSurface.Grading,
                                task: AiModelTask.TaskGrading,
                                model: "claude-sonnet",
                                provider: "anthropic",
                                recommendation: null,
                                promptTokens: 900,
                                completionTokens: 210,
                                attempts: 2,
                            },
                        )
                    })

                it("charges nothing and nulls the attribution when the grade carried no AI usage",
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

                        expect(aiModelCatalogService.creditForRun).not.toHaveBeenCalled()
                        expect(creditService.consume).toHaveBeenCalledWith(
                            entityManager,
                            expect.objectContaining({
                                cost: 0,
                                model: null,
                                provider: null,
                                promptTokens: null,
                                completionTokens: null,
                                attempts: null,
                            }),
                        )
                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserMilestoneTaskAttemptEntity,
                            expect.objectContaining({
                                servedModel: null,
                                servedProvider: null,
                                promptTokens: null,
                                completionTokens: null,
                            }),
                        )
                    })
            })

        describe("the passed-task reward",
            () => {
                it("grants the flat milestone XP, writes the activity and refreshes the projection",
                    async () => {
                        await service.process(makeContext() as never)

                        expect(writeXpHistory).toHaveBeenCalledWith({
                            entityManager,
                            userId: "user-1",
                            courseId: "course-1",
                            source: XpSource.Milestone,
                            // the per-course weighted grant, not the grade score
                            amount: 10,
                            points: expect.any(Number),
                            // keyed by the user-milestone-task so re-passing never re-credits
                            refId: "umt-1",
                        })
                        expect(writeActivity).toHaveBeenCalledWith({
                            entityManager,
                            userId: "user-1",
                            type: ActivityType.MilestonePassed,
                            idempotencyKey: "umt-1",
                            metadata: {
                                target: {
                                    entityName: "MilestoneTaskEntity",
                                    id: "task-1",
                                    label: "Ship the auth module",
                                },
                            },
                        })
                        expect(progressProjectionService.recompute).toHaveBeenCalledWith({
                            userId: "user-1",
                            courseId: "course-1",
                            entityManager,
                        })
                    })

                it("grants nothing when the task was not passed",
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
                        // the attempt still records the failure
                        expect(entityManager.save).toHaveBeenCalledWith(
                            UserMilestoneTaskAttemptEntity,
                            expect.objectContaining({
                                passed: false,
                            }),
                        )
                    })

                it("still grants XP but writes no activity when the milestone task is unresolvable",
                    async () => {
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === UserMilestoneTaskEntity) {
                                return userMilestoneTaskRow
                            }
                            if (entity === EnrollmentEntity) {
                                return enrollmentRow
                            }
                            // the task row is gone
                            return null
                        })

                        await service.process(makeContext() as never)

                        expect(writeXpHistory).toHaveBeenCalled()
                        expect(writeActivity).not.toHaveBeenCalled()
                        expect(progressProjectionService.recompute).toHaveBeenCalled()
                    })

                it("skips the whole reward when the enrollment cannot be resolved",
                    async () => {
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === UserMilestoneTaskEntity) {
                                return userMilestoneTaskRow
                            }
                            if (entity === MilestoneTaskEntity) {
                                return milestoneTaskRow
                            }
                            // no enrollment row anywhere
                            return null
                        })

                        await service.process(makeContext() as never)

                        expect(writeXpHistory).not.toHaveBeenCalled()
                        expect(progressProjectionService.recompute).not.toHaveBeenCalled()
                        // the debit still went through -- it reads via findOneOrFail
                        expect(creditService.consume).toHaveBeenCalled()
                        expect(jobActionService.increaseJob).toHaveBeenCalled()
                    })
            })

        describe("idempotency and fencing",
            () => {
                it("does nothing inside the transaction when an attempt for this job already exists",
                    async () => {
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === UserMilestoneTaskAttemptEntity) {
                                return {
                                    id: "attempt-existing",
                                }
                            }
                            return null
                        })

                        await service.process(makeContext() as never)

                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(creditService.consume).not.toHaveBeenCalled()
                        expect(jobActionService.increaseJob).not.toHaveBeenCalled()
                        expect(enqueueLearnerEmail).not.toHaveBeenCalled()
                        // the progress event still fires so the read side self-heals
                        expect(eventEmitterService.emit).toHaveBeenCalled()
                    })

                it("swallows the unique-violation a concurrent duplicate lost the race on",
                    async () => {
                        entityManager.transaction.mockRejectedValue(new QueryFailedError(
                            "INSERT INTO user_milestone_task_attempts ...",
                            [],
                            Object.assign(
                                new Error("duplicate key value violates unique constraint"),
                                {
                                    code: PG_UNIQUE_VIOLATION,
                                },
                            ),
                        ))

                        await expect(service.process(makeContext() as never)).resolves.toBeUndefined()

                        expect(winstonService.log).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                        expect(enqueueLearnerEmail).not.toHaveBeenCalled()
                    })

                it("rethrows a QueryFailedError carrying a different SQLSTATE",
                    async () => {
                        const otherError = new QueryFailedError(
                            "INSERT INTO user_milestone_task_attempts ...",
                            [],
                            Object.assign(
                                new Error("foreign key violation"),
                                {
                                    code: "23503",
                                },
                            ),
                        )
                        entityManager.transaction.mockRejectedValue(otherError)

                        await expect(service.process(makeContext() as never)).rejects.toBe(otherError)
                    })

                it("rethrows a QueryFailedError whose driver error carries no code at all",
                    async () => {
                        const codelessError = new QueryFailedError(
                            "INSERT INTO user_milestone_task_attempts ...",
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
                            expectedFencingToken: 4,
                        }))

                        await expect(service.process(makeContext() as never)).resolves.toBeUndefined()

                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })

                it("rethrows any other transaction failure",
                    async () => {
                        const failure = new Error("serialization failure")
                        entityManager.transaction.mockRejectedValue(failure)

                        await expect(service.process(makeContext() as never)).rejects.toBe(failure)
                    })

                it("rethrows a non-Error transaction failure without emitting completion events",
                    async () => {
                        entityManager.transaction.mockRejectedValue("transaction unavailable")

                        await expect(service.process(makeContext() as never)).rejects.toBe("transaction unavailable")
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })
            })

        describe("after-commit side effects",
            () => {
                it("logs the step and announces the milestone progress update",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.ProcessStepExecuted,
                            {
                                jobId: "job-1",
                                queueName: "review-milestone-task",
                                step: "complete",
                                stepIndex: 1,
                                payload: context.payload,
                                success: true,
                            },
                        )
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.MilestoneTaskProgressUpdated,
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
                            WinstonLog.ProcessStepExecuted,
                            expect.objectContaining({
                                jobId: "",
                            }),
                        )
                    })

                it("emails the learner their review and raises a graded notification",
                    async () => {
                        await service.process(makeContext({
                            locale: Locale.Vi,
                        }) as never)

                        expect(enqueueLearnerEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                entityManager,
                                enqueueSendMailJobService,
                                userId: "user-1",
                                template: "milestone-result",
                                locale: Locale.Vi,
                                extraContext: {
                                    score: 91,
                                    passed: true,
                                    feedback: "clean architecture",
                                },
                            }),
                        )
                        expect(notificationService.createNotification).toHaveBeenCalledWith({
                            userId: "user-1",
                            type: NotificationType.MilestoneGraded,
                            title: {
                                key: "notification.milestoneGraded.title",
                                params: {
                                    title: "Ship the auth module",
                                    result: "passed",
                                },
                            },
                            target: {
                                entityName: "MilestoneTaskEntity",
                                id: "task-1",
                                label: "Ship the auth module",
                            },
                        })
                    })

                it("sends an empty feedback string when the grade left none",
                    async () => {
                        jobActionService.loadExecutionResult.mockImplementation(
                            async ({ key }: LoadExecutionResultParams) => (
                                key === "grade"
                                    ? makeGrade({
                                        evaluation: {
                                            score: 50,
                                            shortFeedback: null,
                                            details: [],
                                        },
                                        passed: false,
                                    })
                                    : undefined
                            ),
                        )

                        await service.process(makeContext() as never)

                        expect(enqueueLearnerEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                extraContext: {
                                    score: 50,
                                    passed: false,
                                    feedback: "",
                                },
                            }),
                        )
                    })

                it("says failed and drops the deep-link target when the task is unresolvable",
                    async () => {
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === UserMilestoneTaskEntity) {
                                return userMilestoneTaskRow
                            }
                            if (entity === EnrollmentEntity) {
                                return enrollmentRow
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
                            type: NotificationType.MilestoneGraded,
                            title: {
                                key: "notification.milestoneGraded.title",
                                params: {
                                    title: "",
                                    result: "failed",
                                },
                            },
                            target: undefined,
                        })
                    })

                it("skips the whole learner notification when the enrollment vanished after commit",
                    async () => {
                        let enrollmentReads = 0
                        entityManager.findOne.mockImplementation(async (entity: unknown) => {
                            if (entity === UserMilestoneTaskEntity) {
                                return userMilestoneTaskRow
                            }
                            if (entity === MilestoneTaskEntity) {
                                return milestoneTaskRow
                            }
                            if (entity === EnrollmentEntity) {
                                enrollmentReads += 1
                                // the in-transaction read succeeds; the post-commit one does not
                                return enrollmentReads === 1 ? enrollmentRow : null
                            }
                            return null
                        })

                        await service.process(makeContext() as never)

                        expect(writeXpHistory).toHaveBeenCalled()
                        expect(enqueueLearnerEmail).not.toHaveBeenCalled()
                        expect(notificationService.createNotification).not.toHaveBeenCalled()
                    })

                it("logs and swallows a notification failure so the committed review still succeeds",
                    async () => {
                        notificationService.createNotification.mockRejectedValue(
                            new Error("notification store down"),
                        )
                        const context = makeContext()

                        await expect(service.process(context as never)).resolves.toBeUndefined()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.ProcessStepExecuted,
                            {
                                jobId: "job-1",
                                queueName: "review-milestone-task",
                                step: "complete",
                                stepIndex: 1,
                                payload: context.payload,
                                success: false,
                                error: "notification store down",
                            },
                        )
                        // the email already landed before the notification attempt
                        expect(enqueueLearnerEmail).toHaveBeenCalled()
                    })

                it("stringifies a non-Error notification failure and reports an absent job id as empty",
                    async () => {
                        notificationService.createNotification.mockRejectedValue("bell exploded")

                        await service.process(makeContext({
                            jobId: null,
                        }) as never)

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.ProcessStepExecuted,
                            expect.objectContaining({
                                jobId: "",
                                success: false,
                                error: "bell exploded",
                            }),
                        )
                    })

                it("rethrows a transaction failure before sending learner notifications",
                    async () => {
                        const failure = new Error("transaction unavailable")
                        entityManager.transaction.mockRejectedValueOnce(failure)

                        await expect(service.process(makeContext() as never)).rejects.toBe(failure)

                        expect(enqueueSendMailJobService.enqueue).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })
            })
    })
