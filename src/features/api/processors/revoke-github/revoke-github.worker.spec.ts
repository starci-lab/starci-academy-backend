import type {
    Job,
} from "bullmq"
import type {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RevokeGithubWorker,
} from "./revoke-github.worker"

jest.mock("octokit",
    () => ({
        Octokit: jest.fn(),
    }))

interface FailureParams {
    error: string
}

describe("RevokeGithubWorker retry lifecycle",
    () => {
        it.each([
            [0,
                JobStatus.Processing,
                0],
            [1,
                JobStatus.Failed,
                1],
        ])("with attemptsMade=%s persists %s and records terminal failure %s time(s)",
            async (attemptsMade, expectedStatus, expectedFailures) => {
                const trackedJob = {
                    id: "revoke-job",
                    currentStep: 0,
                    maxSteps: 1,
                    status: JobStatus.Queued,
                } as JobEntity
                const jobActionService = {
                    getJob: jest.fn().mockResolvedValue(trackedJob),
                    processingJob: jest.fn().mockImplementation(() => {
                        trackedJob.status = JobStatus.Processing
                    }),
                    completeJob: jest.fn(),
                    failJob: jest.fn().mockImplementation(({ error }: FailureParams) => {
                        trackedJob.status = JobStatus.Failed
                        trackedJob.error = error
                    }),
                }
                const failure = new Error("GitHub revoke failed")
                const stepMappingService = {
                    getStepMap: jest.fn().mockReturnValue(new Map([
                        [0,
                            {
                                process: jest.fn().mockRejectedValue(failure),
                            }],
                    ])),
                }
                const worker = new RevokeGithubWorker(
                    jobActionService as never,
                    {
                        parse: jest.fn().mockReturnValue({
                        }),
                    } as never,
                    stepMappingService as never,
                    {
                        log: jest.fn(),
                    } as never,
                    new DayjsService(),
                )
                const bullJob = {
                    id: trackedJob.id,
                    data: "{}",
                    queueName: "revoke-github",
                    attemptsMade,
                    opts: {
                        attempts: 2,
                    },
                } as Job<string>

                await expect(worker.process(bullJob)).rejects.toBe(failure)
                expect(trackedJob.status).toBe(expectedStatus)
                expect(jobActionService.failJob).toHaveBeenCalledTimes(expectedFailures)
            })

        it("records a terminal malformed-payload failure without invoking a step",
            async () => {
                const trackedJob = {
                    id: "revoke-job",
                    currentStep: 0,
                    maxSteps: 1,
                } as JobEntity
                const failure = new Error("invalid payload")
                const jobActionService = {
                    getJob: jest.fn().mockResolvedValue(trackedJob),
                    processingJob: jest.fn(),
                    completeJob: jest.fn(),
                    failJob: jest.fn(),
                }
                const step = jest.fn()
                const worker = new RevokeGithubWorker(
                    jobActionService as never,
                    {
                        parse: jest.fn().mockImplementation(() => {
                            throw failure
                        }),
                    } as never,
                    {
                        getStepMap: jest.fn().mockReturnValue(new Map([[0,
                            {
                                process: step,
                            }]])),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                    new DayjsService(),
                )

                await expect(worker.process({
                    id: trackedJob.id,
                    data: "bad",
                    queueName: "revoke-github",
                    attemptsMade: 1,
                    opts: {
                        attempts: 2,
                    },
                } as Job<string>)).rejects.toBe(failure)
                expect(step).not.toHaveBeenCalled()
                expect(jobActionService.failJob).toHaveBeenCalled()
            })
    })
