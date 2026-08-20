import type {
    Job,
} from "bullmq"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ChallengeNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"
import {
    UserChallengeSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/courses/user-challenge-submission-not-found"
import {
    StepNotFoundException,
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    ProcessGoogleDocsSubmissionWorker,
} from "./process-google-docs-submission.worker"

const job = (
    currentStep: number,
    maxSteps = 1,
): JobEntity => ({
    id: "job-1",
    currentStep,
    maxSteps,
} as unknown as JobEntity)

const bullJob = (): Job<string> => ({
    id: "bull-1",
    data: "serialized",
    queueName: "process-google-docs-submission",
} as unknown as Job<string>)

const makeWorker = () => {
    const now = {
        diff: jest.fn().mockReturnValue(15) 
    }
    const jobActionService = {
        getJob: jest.fn(),
        processingJob: jest.fn().mockResolvedValue(undefined),
        completeJob: jest.fn().mockResolvedValue(undefined),
    }
    const superJson = {
        parse: jest.fn().mockReturnValue({
            userChallengeSubmissionId: "user-submission-1" 
        }),
    }
    const stepProcess = jest.fn().mockResolvedValue(undefined)
    const stepMappingService = {
        getStepMap: jest.fn().mockReturnValue(new Map([
            [0,
                {
                    process: stepProcess,
                }],
            [1,
                {
                    process: stepProcess,
                }],
            [2,
                {
                    process: stepProcess,
                }],
        ])),
    }
    const winstonService = {
        log: jest.fn() 
    }
    const dayjsService = {
        now: jest.fn().mockReturnValue(now),
        from: jest.fn().mockReturnValue({
        }),
    }
    const userChallengeSubmission = {
        id: "user-submission-1",
        submissionId: "submission-1",
    }
    const challengeSubmission = {
        id: "submission-1",
        challengeId: "challenge-1",
    }
    const challenge = {
        id: "challenge-1",
        title: "Build a parser",
    }
    const entityManager = {
        findOne: jest.fn((entity: unknown) => {
            if (entity === UserChallengeSubmissionEntity) {
                return Promise.resolve(userChallengeSubmission)
            }
            if (entity === ChallengeSubmissionEntity) {
                return Promise.resolve(challengeSubmission)
            }
            if (entity === ChallengeEntity) {
                return Promise.resolve(challenge)
            }
            return Promise.resolve(null)
        }),
    }
    const worker = new ProcessGoogleDocsSubmissionWorker(
        jobActionService as never,
        superJson as never,
        stepMappingService as never,
        winstonService as never,
        dayjsService as never,
        entityManager as never,
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
        userChallengeSubmission,
        challengeSubmission,
        challenge,
    }
}

describe("ProcessGoogleDocsSubmissionWorker",
    () => {
        it("loads the grading context, executes the mapped step, and completes successfully",
            async () => {
                const harness = makeWorker()
                harness.jobActionService.getJob
                    .mockResolvedValueOnce(job(0,
                        2))
                    .mockResolvedValueOnce(job(0,
                        2))
                    .mockResolvedValueOnce(job(1,
                        2))
                    .mockResolvedValueOnce(job(2,
                        2))

                await expect(harness.worker.process(bullJob())).resolves.toBeUndefined()
                expect(harness.jobActionService.processingJob).toHaveBeenCalledWith({
                    job: job(0,
                        2) 
                })
                expect(harness.superJson.parse).toHaveBeenCalledWith("serialized")
                expect(harness.stepProcess).toHaveBeenCalledWith(expect.objectContaining({
                    payload: {
                        userChallengeSubmissionId: "user-submission-1" 
                    },
                    extended: {
                        challengeSubmission: harness.challengeSubmission,
                        challenge: harness.challenge,
                        userChallengeSubmission: harness.userChallengeSubmission,
                    },
                }))
                expect(harness.jobActionService.completeJob).toHaveBeenCalledWith({
                    job: job(2,
                        2) 
                })
                expect(harness.winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        jobId: "job-1",
                        durationMs: 15,
                    }),
                )
            })

        it("fails with a typed error when the user submission is missing",
            async () => {
                const harness = makeWorker()
                harness.jobActionService.getJob.mockResolvedValue(job(0))
                harness.entityManager.findOne.mockImplementation((entity: unknown) => entity === UserChallengeSubmissionEntity
                    ? Promise.resolve(null)
                    : Promise.resolve(harness.challenge))

                await expect(harness.worker.process(bullJob())).rejects.toThrow(UserChallengeSubmissionNotFoundException)
                expect(harness.winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        error: "User challenge submission not found",
                    }),
                )
            })

        it("fails when the challenge is missing or the current step is not mapped",
            async () => {
                const missingChallenge = makeWorker()
                missingChallenge.jobActionService.getJob.mockResolvedValue(job(0))
                missingChallenge.entityManager.findOne.mockImplementation((entity: unknown) => (entity === ChallengeEntity
                    ? Promise.resolve(null)
                    : Promise.resolve(entity === UserChallengeSubmissionEntity
                        ? missingChallenge.userChallengeSubmission
                        : missingChallenge.challengeSubmission)) as never)
                await expect(missingChallenge.worker.process(bullJob())).rejects.toThrow(ChallengeNotFoundException)

                const missingStep = makeWorker()
                missingStep.jobActionService.getJob
                    .mockResolvedValueOnce(job(0))
                    .mockResolvedValueOnce(job(3))
                missingStep.stepMappingService.getStepMap.mockReturnValue(new Map())
                await expect(missingStep.worker.process(bullJob())).rejects.toThrow(StepNotFoundException)
            })
    })
