import {
    makeEntityManagerMock,
    EntityManagerMock,
} from "@modules/tests"
import {
    DayjsService,
} from "@modules/mixin"
import {
    AiMode,
    EnrollmentEntity,
    Locale,
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/exceptions"
import {
    ProcessGitSubmissionCompleteStepService,
} from "./process-git-submission-complete-step.service"

/** A passing grade result as the grade step would persist it. */
const gradeResult = {
    evaluation: {
        score: 80,
        shortFeedback: "ok",
        details: [],
    },
    passed: true,
    aiUsage: {
        model: "m",
        provider: "p",
        attempts: 1,
    },
}

/** Minimal job + payload context the complete step reads. */
const makeContext = () => ({
    job: {
        id: "job-1",
        fencingToken: 3,
    },
    queueName: "process-git-submission",
    payload: {
        userChallengeSubmissionId: "ucs-1",
        enrollmentId: "enroll-1",
        locale: Locale.En,
        ai: {
            mode: AiMode.Byok,
        },
    },
    extended: {
        userChallengeSubmission: {
            submissionUrl: "https://github.com/me/repo",
        },
    },
}) as never

describe("ProcessGitSubmissionCompleteStepService",
    () => {
        let entityManager: EntityManagerMock
        let jobActionService: {
            loadExecutionResult: jest.Mock
            increaseJob: jest.Mock
            saveExecutionResult: jest.Mock
        }
        let aiEntitlementService: { consume: jest.Mock }
        let creditUsageService: { invalidate: jest.Mock }
        let eventEmitterService: { emit: jest.Mock }
        let service: ProcessGitSubmissionCompleteStepService

        beforeEach(() => {
            entityManager = makeEntityManagerMock()
            // grade result is loaded by key; the "creditCharged" marker is absent by default
            jobActionService = {
                loadExecutionResult: jest.fn().mockImplementation(
                    ({ key }: { key: string }) => (key === "grade" ? gradeResult : undefined),
                ),
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
            }
            aiEntitlementService = {
                consume: jest.fn(),
            }
            creditUsageService = {
                invalidate: jest.fn(),
            }
            eventEmitterService = {
                emit: jest.fn(),
            }
            service = new ProcessGitSubmissionCompleteStepService(
                entityManager as never,
                jobActionService as never,
                {
                    log: jest.fn(),
                } as never,
                eventEmitterService as never,
                new DayjsService(),
                creditUsageService as never,
                aiEntitlementService as never,
                {
                    recompute: jest.fn(),
                } as never,
                {
                    enqueue: jest.fn(),
                } as never,
            )
        })

        it("throws when the grade result is missing",
            async () => {
                jobActionService.loadExecutionResult.mockResolvedValue(undefined)
                await expect(service.process(makeContext())).rejects.toBeInstanceOf(
                    MissingOrInvalidGradeExecutionResultException,
                )
            })

        it("creates exactly one attempt and charges once on a fresh job",
            async () => {
                // no prior attempt for this idempotency key; enrollment + ledger lookups resolve
                entityManager.findOne.mockImplementation(
                    (entity: unknown) => {
                        if (entity === EnrollmentEntity) {
                            return Promise.resolve({
                                id: "enroll-1",
                                userId: "user-1",
                                courseId: "course-1",
                            })
                        }
                        // attempt-by-idempotencyKey + xp-history idempotency lookup → none yet
                        return Promise.resolve(null)
                    },
                )
                entityManager.findOneOrFail.mockResolvedValue({
                    userId: "user-1",
                })
                entityManager.count.mockResolvedValue(0)
                // writeXpHistory credits the points balance (increment isn't on the base mock type)
                const managerWithIncrement = entityManager as unknown as { increment: jest.Mock }
                managerWithIncrement.increment = jest.fn().mockResolvedValue({
                    affected: 1,
                })

                await service.process(makeContext())

                // exactly one attempt persisted, keyed by the job id (idempotency)
                expect(entityManager.save).toHaveBeenCalledWith(
                    UserChallengeSubmissionAttemptEntity,
                    expect.objectContaining({
                        idempotencyKey: "job-1",
                        attemptNumber: 1,
                    }),
                )
                // step advanced under the fencing guard
                expect(jobActionService.increaseJob).toHaveBeenCalledWith(
                    expect.objectContaining({
                        expectedFencingToken: 3,
                    }),
                )
                // charged once (no prior "creditCharged" marker)
                expect(aiEntitlementService.consume).toHaveBeenCalledTimes(1)
            })

        it("is idempotent: a re-run with an existing attempt makes no new attempt and no charge",
            async () => {
                // an attempt with this idempotency key already exists → the whole body is skipped
                entityManager.findOne.mockResolvedValue({
                    id: "attempt-existing",
                })

                await service.process(makeContext())

                // no second attempt, no step advance, no second charge
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(jobActionService.increaseJob).not.toHaveBeenCalled()
                expect(aiEntitlementService.consume).not.toHaveBeenCalled()
            })
    })
