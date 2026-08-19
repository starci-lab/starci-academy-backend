import {
    makeEntityManagerMock,
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/platform/exceptions/errors/ai/missing-or-invalid-grade-execution-result"
import {
    SubmissionCompletionNotifierService,
} from "../../shared/challenge-submission/submission-completion-notifier.service"
import {
    LegacyCreditChargeService,
} from "../../shared/challenge-submission/legacy-credit-charge.service"
import {
    ProcessGitSubmissionCompleteStepService,
} from "./process-git-submission-complete-step.service"

/** Params the mocked `jobActionService.loadExecutionResult` is invoked with. */
interface LoadExecutionResultMockParams {
    key: string
}

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
        let eventEmitterService: { emit: jest.Mock }
        let service: ProcessGitSubmissionCompleteStepService

        beforeEach(() => {
            entityManager = makeEntityManagerMock()
            // grade result is loaded by key; the "creditCharged" marker is absent by default
            jobActionService = {
                loadExecutionResult: jest.fn().mockImplementation(
                    ({ key }: LoadExecutionResultMockParams) => (key === "grade" ? gradeResult : undefined),
                ),
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
            }
            aiEntitlementService = {
                consume: jest.fn(),
            }
            eventEmitterService = {
                emit: jest.fn(),
            }
            const legacyCreditChargeService = new LegacyCreditChargeService(
                jobActionService as never,
                aiEntitlementService as never,
                {
                    creditForRun: jest.fn().mockResolvedValue(0),
                } as never,
            )
            const submissionCompletionNotifierService = new SubmissionCompletionNotifierService(
                entityManager as never,
                {
                    enqueue: jest.fn(),
                } as never,
                {
                    createNotification: jest.fn(),
                } as never,
                {
                    log: jest.fn(),
                } as never,
            )
            service = new ProcessGitSubmissionCompleteStepService(
                entityManager as never,
                jobActionService as never,
                {
                    log: jest.fn(),
                } as never,
                eventEmitterService as never,
                new DayjsService(),
                {
                    recompute: jest.fn(),
                } as never,
                {
                    invalidateProgress: jest.fn(),
                } as never,
                submissionCompletionNotifierService,
                legacyCreditChargeService,
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
                        // attempt-by-idempotencyKey + xp-history idempotency lookup -> none yet
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
                // an attempt with this idempotency key already exists -> the whole body is skipped
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
