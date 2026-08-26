import type {
    Job,
} from "bullmq"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    CodingSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-submission.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    CodingVerdict,
} from "@modules/databases/postgresql/primary/enums/coding-verdict"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    CodingProblemNotFoundException,
} from "@modules/platform/exceptions/errors/coding/coding-problem-not-found"
import {
    CodingSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/coding/coding-submission-not-found"
import {
    Judge0TimedOutException,
} from "@modules/platform/exceptions/errors/coding/judge0-timed-out"
import {
    JudgeCodingSubmissionWorker,
} from "./judge-coding-submission.worker"

const bullJob = (): Job<string> => ({
    id: "bull-1",
    data: "serialized-payload",
    queueName: "judge-coding-submission",
} as unknown as Job<string>)

const trackedJob = (
    currentStep: number,
    maxSteps = 1,
): JobEntity => ({
    id: "job-1",
    currentStep,
    maxSteps,
} as unknown as JobEntity)

const pendingSubmission = (): CodingSubmissionEntity => ({
    id: "submission-1",
    userId: "user-1",
    codingProblemId: "problem-1",
    verdict: CodingVerdict.Pending,
} as unknown as CodingSubmissionEntity)

const makeWorker = (overrides: Record<string, unknown> = {
}) => {
    const now = {
        diff: jest.fn().mockReturnValue(42),
    }
    const jobActionService = {
        getJob: jest.fn(),
        processingJob: jest.fn().mockResolvedValue(undefined),
        completeJob: jest.fn().mockResolvedValue(undefined),
        failJob: jest.fn().mockResolvedValue(undefined),
    }
    const superJson = {
        parse: jest.fn().mockReturnValue({
            codingSubmissionId: "submission-1"
        }),
    }
    const stepProcess = jest.fn().mockResolvedValue(undefined)
    const stepMappingService = {
        getStepMap: jest.fn().mockReturnValue(new Map([[0,
            {
                process: stepProcess,
            }]])),
    }
    const winstonService = {
        log: jest.fn(),
    }
    const dayjsService = {
        now: jest.fn().mockReturnValue(now),
        from: jest.fn().mockReturnValue({
        }),
    }
    const submission = pendingSubmission()
    const problem = {
        id: "problem-1",
        title: "Two sum",
    }
    const entityManager = {
        findOne: jest.fn((entity: unknown) => {
            if (entity === CodingSubmissionEntity) {
                return Promise.resolve(submission)
            }
            if (entity === CodingProblemEntity) {
                return Promise.resolve(problem)
            }
            return Promise.resolve(null)
        }),
        find: jest.fn().mockResolvedValue([{
            id: "testcase-1",
            sortIndex: 0,
        }]),
        save: jest.fn().mockResolvedValue(submission),
    }
    const notificationService = {
        createNotification: jest.fn().mockResolvedValue(undefined),
    }
    const worker = new JudgeCodingSubmissionWorker(
        jobActionService as never,
        superJson as never,
        stepMappingService as never,
        winstonService as never,
        dayjsService as never,
        entityManager as never,
        notificationService as never,
    )
    return {
        worker,
        jobActionService,
        superJson,
        stepMappingService,
        stepProcess,
        winstonService,
        dayjsService,
        entityManager,
        notificationService,
        submission,
        problem,
        ...overrides,
    }
}

describe("JudgeCodingSubmissionWorker — process",
    () => {
        it("loads the submission/problem, runs the mapped step, and completes the job",
            async () => {
                const harness = makeWorker()
                harness.jobActionService.getJob
                    .mockResolvedValueOnce(trackedJob(0))
                    .mockResolvedValueOnce(trackedJob(0))
                    .mockResolvedValueOnce(trackedJob(1))

                await expect(harness.worker.process(bullJob())).resolves.toBeUndefined()

                expect(harness.jobActionService.processingJob).toHaveBeenCalledWith({
                    job: trackedJob(0),
                })
                expect(harness.superJson.parse).toHaveBeenCalledWith("serialized-payload")
                expect(harness.stepMappingService.getStepMap).toHaveBeenCalledTimes(1)
                expect(harness.stepProcess).toHaveBeenCalledWith(expect.objectContaining({
                    payload: {
                        codingSubmissionId: "submission-1"
                    },
                    extended: expect.objectContaining({
                        submission: harness.submission,
                        problem: harness.problem,
                    }),
                }))
                expect(harness.jobActionService.completeJob).toHaveBeenCalledWith({
                    job: trackedJob(1),
                })
                expect(harness.jobActionService.failJob).not.toHaveBeenCalled()
                expect(harness.winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        jobId: "job-1",
                        payload: {
                            codingSubmissionId: "submission-1"
                        },
                        durationMs: 42,
                    }),
                )
            })

        it("fails and rethrows when the submission row is missing",
            async () => {
                const harness = makeWorker()
                harness.entityManager.findOne.mockImplementation((entity: unknown) => entity === CodingSubmissionEntity
                    ? Promise.resolve(null)
                    : Promise.resolve(harness.problem))
                harness.jobActionService.getJob.mockResolvedValue(trackedJob(0))

                await expect(harness.worker.process(bullJob())).rejects.toThrow(CodingSubmissionNotFoundException)
                expect(harness.entityManager.findOne).toHaveBeenCalledWith(
                    CodingSubmissionEntity,
                    expect.objectContaining({
                        where: {
                            id: "submission-1"
                        }
                    }),
                )
                expect(harness.jobActionService.failJob).toHaveBeenCalledWith(expect.objectContaining({
                    job: trackedJob(0),
                }))
                expect(harness.entityManager.save).not.toHaveBeenCalled()
            })

        it("persists and notifies a terminal internal error when the problem is missing",
            async () => {
                const harness = makeWorker()
                harness.entityManager.findOne.mockImplementation((entity: unknown) => entity === CodingSubmissionEntity
                    ? Promise.resolve(harness.submission)
                    : Promise.resolve(null))
                harness.jobActionService.getJob.mockResolvedValue(trackedJob(0))

                await expect(harness.worker.process(bullJob())).rejects.toThrow(CodingProblemNotFoundException)
                expect(harness.submission.verdict).toBe(CodingVerdict.InternalError)
                expect(harness.entityManager.save).toHaveBeenCalledWith(
                    CodingSubmissionEntity,
                    harness.submission,
                )
                expect(harness.notificationService.createNotification).toHaveBeenCalledWith({
                    userId: "user-1",
                    type: NotificationType.CodingGraded,
                    title: {
                        key: "notification.codingGraded.title",
                        params: {
                            title: "",
                            verdictLabel: "Internal error",
                        },
                    },
                    target: {
                        entityName: CodingSubmissionEntity.name,
                        id: "submission-1",
                        label: "",
                    },
                })
                expect(harness.jobActionService.failJob).toHaveBeenCalled()
            })

        it("completes cleanly when the current step has no registered processor",
            async () => {
                const harness = makeWorker()
                harness.jobActionService.getJob
                    .mockResolvedValueOnce(trackedJob(0))
                    .mockResolvedValueOnce(trackedJob(1))
                harness.stepMappingService.getStepMap.mockReturnValue(new Map())

                await expect(harness.worker.process(bullJob())).resolves.toBeUndefined()

                expect(harness.stepProcess).not.toHaveBeenCalled()
                expect(harness.jobActionService.completeJob).toHaveBeenCalledWith({
                    job: trackedJob(1),
                })
            })

        it("logs an empty tracked id on successful completion",
            async () => {
                const harness = makeWorker()
                const first = trackedJob(0)
                first.id = undefined as never
                const finished = trackedJob(1)
                finished.id = undefined as never
                harness.jobActionService.getJob
                    .mockResolvedValueOnce(first)
                    .mockResolvedValueOnce(finished)

                await expect(harness.worker.process(bullJob())).resolves.toBeUndefined()
                expect(harness.winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        jobId: "",
                    }),
                )
            })

        it("stringifies a non-Error step failure before failing the tracked job",
            async () => {
                const harness = makeWorker()
                harness.submission.verdict = CodingVerdict.Accepted
                harness.jobActionService.getJob.mockResolvedValue(trackedJob(0))
                harness.stepProcess.mockRejectedValueOnce("judge unavailable")

                await expect(harness.worker.process(bullJob())).rejects.toBe("judge unavailable")
                expect(harness.jobActionService.failJob).toHaveBeenCalledWith({
                    job: trackedJob(0),
                    error: "judge unavailable",
                })
            })
    })

describe("JudgeCodingSubmissionWorker — terminal failure helpers",
    () => {
        it("classifies a Judge0 timeout as time-limit exceeded",
            async () => {
                const harness = makeWorker()
                const persist = (harness.worker as unknown as {
            persistTerminalFailureVerdict: (params: {
                submission: CodingSubmissionEntity
                error: unknown
                bullmqJob: Job<string>
            }) => Promise<void>
        }).persistTerminalFailureVerdict
                const timeout = new Judge0TimedOutException({
                    attempts: 3,
                    pendingCount: 1,
                })

                await persist.call(harness.worker,
                    {
                        submission: harness.submission,
                        error: timeout,
                        bullmqJob: bullJob(),
                    })

                expect(harness.submission.verdict).toBe(CodingVerdict.TimeLimitExceeded)
                expect(harness.entityManager.save).toHaveBeenCalledWith(
                    CodingSubmissionEntity,
                    harness.submission,
                )
            })

        it("logs but swallows notification failures",
            async () => {
                const harness = makeWorker()
                harness.entityManager.findOne.mockResolvedValue(null)
                harness.notificationService.createNotification.mockRejectedValue(new Error("notification offline"))
                const notify = (harness.worker as unknown as {
            notifySubmissionGradedFailure: (params: {
                submission: CodingSubmissionEntity
                bullmqJob: Job<string>
                job: JobEntity | undefined
            }) => Promise<void>
        }).notifySubmissionGradedFailure

                await expect(notify.call(harness.worker,
                    {
                        submission: harness.submission,
                        bullmqJob: bullJob(),
                        job: trackedJob(0),
                    })).resolves.toBeUndefined()
                expect(harness.winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        jobId: "job-1",
                        error: "notification offline",
                    }),
                )
            })

        it("uses the persisted problem title and raw verdict when notifying",
            async () => {
                const harness = makeWorker()
                harness.entityManager.findOne.mockResolvedValue({
                    id: "problem-1",
                    title: "Two sum",
                })
                harness.submission.verdict = CodingVerdict.WrongAnswer
                const notify = (harness.worker as unknown as {
            notifySubmissionGradedFailure: (params: {
                submission: CodingSubmissionEntity
                bullmqJob: Job<string>
                job: JobEntity | undefined
            }) => Promise<void>
        }).notifySubmissionGradedFailure

                await notify.call(harness.worker,
                    {
                        submission: harness.submission,
                        bullmqJob: bullJob(),
                        job: undefined,
                    })

                expect(harness.notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
                    title: {
                        key: "notification.codingGraded.title",
                        params: {
                            title: "Two sum",
                            verdictLabel: CodingVerdict.WrongAnswer,
                        },
                    },
                }))
            })

        it("swallows non-Error notification failures without a tracked job",
            async () => {
                const harness = makeWorker()
                harness.entityManager.findOne.mockResolvedValue(null)
                harness.notificationService.createNotification.mockRejectedValueOnce(
                    "notification unavailable",
                )
                const notify = (harness.worker as unknown as {
                    notifySubmissionGradedFailure: (params: {
                        submission: CodingSubmissionEntity
                        bullmqJob: Job<string>
                        job: JobEntity | undefined
                    }) => Promise<void>
                }).notifySubmissionGradedFailure

                await expect(notify.call(harness.worker,
                    {
                        submission: harness.submission,
                        bullmqJob: bullJob(),
                        job: undefined,
                    })).resolves.toBeUndefined()
                expect(harness.winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        jobId: "",
                        error: "notification unavailable",
                    }),
                )
            })

        it("does not dispatch a step after the tracked job reaches its final step",
            async () => {
                const harness = makeWorker()
                harness.jobActionService.getJob.mockResolvedValue(trackedJob(1,
                    1))

                await expect(harness.worker.process(bullJob())).resolves.toBeUndefined()

                expect(harness.stepProcess).not.toHaveBeenCalled()
                expect(harness.jobActionService.completeJob).toHaveBeenCalled()
            })
    })
