import type {
    Job
} from "bullmq"
import {
    ProcessGitSubmissionWorker
} from "./process-git-submission.worker"
import {
    UserChallengeSubmissionEntity
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    ChallengeSubmissionEntity
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    StepNotFoundException
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    UserChallengeSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/courses/user-challenge-submission-not-found"
import {
    ChallengeSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-submission-not-found"
import {
    ChallengeNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"

const make = () => {
    const job = {
        id: "j1", currentStep: 0, maxSteps: 2
    }
    const user = {
        id: "u1", submissionId: "s1"
    }
    const submission = {
        id: "s1", challengeId: "c1"
    }
    const challenge = {
        id: "c1"
    }
    const step = {
        process: jest
            .fn()
            .mockImplementation(async (context: { job: { currentStep: number } }) => {
                context.job.currentStep += 1
            }),
    }
    const services = {
        jobActionService: {
            getJob: jest.fn(),
            processingJob: jest.fn().mockResolvedValue(undefined),
            completeJob: jest.fn().mockResolvedValue(undefined),
        },
        superJson: {
            parse: jest.fn().mockReturnValue({
                userChallengeSubmissionId: "u1"
            }),
        },
        stepMappingService: {
            getStepMap: jest.fn().mockReturnValue(
                new Map([
                    [0,
                        step],
                    [1,
                        step],
                ]),
            ),
        },
        winstonService: {
            log: jest.fn()
        },
        dayjsService: {
            now: jest.fn().mockReturnValue({
                diff: jest.fn().mockReturnValue(3)
            }),
            from: jest.fn(),
        },
        entityManager: {
            findOne: jest.fn((entity: unknown) =>
                Promise.resolve(
                    entity === UserChallengeSubmissionEntity
                        ? user
                        : entity === ChallengeSubmissionEntity
                            ? submission
                            : challenge,
                ),
            ),
        },
    }
    const worker = new ProcessGitSubmissionWorker(
    services.jobActionService as never,
    services.superJson as never,
    services.stepMappingService as never,
    services.winstonService as never,
    services.dayjsService as never,
    services.entityManager as never,
    )
    return {
        worker, ...services, job, user, submission, challenge, step
    }
}
const bull = (): Job<string> =>
  ({
      id: "b1", data: "x", queueName: "git"
  }) as unknown as Job<string>

describe("ProcessGitSubmissionWorker",
    () => {
        it("loads context, runs each current step, and completes",
            async () => {
                const h = make()
                h.jobActionService.getJob
                    .mockResolvedValueOnce(h.job)
                    .mockResolvedValueOnce({
                        ...h.job, currentStep: 0
                    })
                    .mockResolvedValueOnce({
                        ...h.job, currentStep: 1
                    })
                    .mockResolvedValueOnce({
                        ...h.job, currentStep: 2
                    })
                await expect(h.worker.process(bull())).resolves.toBeUndefined()
                expect(h.step.process).toHaveBeenCalledTimes(2)
                expect(h.step.process).toHaveBeenCalledWith(
                    expect.objectContaining({
                        extended: expect.objectContaining({
                            challenge: h.challenge,
                            challengeSubmission: h.submission,
                            userChallengeSubmission: h.user,
                        }),
                    }),
                )
                expect(h.jobActionService.completeJob).toHaveBeenCalledWith({
                    job: {
                        ...h.job, currentStep: 2
                    },
                })
            })
        it("logs and rethrows when a mapped step is missing",
            async () => {
                const h = make()
                h.jobActionService.getJob
                    .mockResolvedValueOnce(h.job)
                    .mockResolvedValueOnce({
                        ...h.job, currentStep: 9
                    })
                h.stepMappingService.getStepMap.mockReturnValue(new Map())
                await expect(h.worker.process(bull())).rejects.toThrow(
                    StepNotFoundException,
                )
                expect(h.jobActionService.completeJob).not.toHaveBeenCalled()
                expect(h.winstonService.log).toHaveBeenCalled()
            })

        it("fails before grading when the user submission row is missing",
            async () => {
                const h = make()
                h.jobActionService.getJob.mockResolvedValueOnce(h.job)
                h.entityManager.findOne.mockResolvedValueOnce(null as never)

                await expect(h.worker.process(bull())).rejects.toBeInstanceOf(
                    UserChallengeSubmissionNotFoundException,
                )
                expect(h.winstonService.log).toHaveBeenCalled()
            })

        it("fails before grading when the source challenge submission is missing",
            async () => {
                const h = make()
                h.jobActionService.getJob.mockResolvedValueOnce(h.job)
                h.entityManager.findOne.mockImplementation((entity: unknown) => Promise.resolve(
                    entity === UserChallengeSubmissionEntity
                        ? h.user
                        : null,
                ) as never)

                await expect(h.worker.process(bull())).rejects.toBeInstanceOf(
                    ChallengeSubmissionNotFoundException,
                )
                expect(h.winstonService.log).toHaveBeenCalled()
            })

        it("fails before grading when the challenge referenced by a submission is missing",
            async () => {
                const h = make()
                h.jobActionService.getJob.mockResolvedValueOnce(h.job)
                h.entityManager.findOne.mockImplementation((entity: unknown) => Promise.resolve(
                    entity === UserChallengeSubmissionEntity
                        ? h.user
                        : entity === ChallengeSubmissionEntity
                            ? h.submission
                            : null,
                ) as never)

                await expect(h.worker.process(bull())).rejects.toBeInstanceOf(
                    ChallengeNotFoundException,
                )
                expect(h.winstonService.log).toHaveBeenCalled()
            })

        it("does not touch persistence when the payload cannot be decoded",
            async () => {
                const h = make()
                h.superJson.parse.mockImplementation(() => {
                    throw new Error("invalid payload")
                })

                await expect(h.worker.process(bull())).rejects.toThrow("invalid payload")
                expect(h.entityManager.findOne).not.toHaveBeenCalled()
                expect(h.jobActionService.completeJob).not.toHaveBeenCalled()
            })
    })
