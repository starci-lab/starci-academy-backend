import type {
    Job
} from "bullmq"
jest.mock("./step-mapping.service",
    () => ({
        StepMappingService: class StepMappingService {},
    }))
import {
    VideoEncoderWorker
} from "./video-encoder.worker"
import {
    StepNotFoundException
} from "@modules/platform/exceptions/errors/job/not-found"
const bull = (attemptsMade = 0, attempts = 1): Job<string> =>
  ({
      id: "b1",
      data: "serialized",
      queueName: "video",
      attemptsMade,
      opts: {
          attempts
      },
  }) as unknown as Job<string>
const make = () => {
    const job = {
            id: "j1", currentStep: 0, maxSteps: 2
        },
        step = {
            process: jest
                .fn()
                .mockImplementation(
                    async (context: { job: { currentStep: number } }) => {
                        context.job.currentStep += 1
                    },
                ),
        }
    const h = {
        jobActionService: {
            getJob: jest.fn(),
            processingJob: jest.fn().mockResolvedValue(undefined),
            completeJob: jest.fn().mockResolvedValue(undefined),
            failJob: jest.fn().mockResolvedValue(undefined),
        },
        superJson: {
            parse: jest.fn().mockReturnValue({
                filename: "clip.mp4"
            })
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
                diff: jest.fn().mockReturnValue(1)
            }),
            from: jest.fn(),
        },
    }
    return {
        worker: new VideoEncoderWorker(
      h.jobActionService as never,
      h.superJson as never,
      h.stepMappingService as never,
      h.winstonService as never,
      h.dayjsService as never,
        ),
        ...h,
        job,
        step,
    }
}
describe("VideoEncoderWorker",
    () => {
        it("resumes steps until maxSteps and completes",
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
                expect(h.jobActionService.completeJob).toHaveBeenCalledWith({
                    job: {
                        ...h.job, currentStep: 2
                    },
                })
            })
        it("fails terminal attempts but does not fail retryable attempts",
            async () => {
                const h = make()
                h.jobActionService.getJob.mockResolvedValue(h.job)
                h.stepMappingService.getStepMap.mockReturnValue(new Map())
                await expect(h.worker.process(bull(0,
                    1))).rejects.toThrow(
                    StepNotFoundException,
                )
                expect(h.jobActionService.failJob).toHaveBeenCalledWith({
                    job: h.job,
                    error: expect.any(String),
                })
                const retry = make()
                retry.jobActionService.getJob.mockResolvedValue(retry.job)
                retry.stepMappingService.getStepMap.mockReturnValue(new Map())
                await expect(retry.worker.process(bull(0,
                    3))).rejects.toThrow(
                    StepNotFoundException,
                )
                expect(retry.jobActionService.failJob).not.toHaveBeenCalled()
            })

        it("maps a non-Error step failure to a stable failed-job message",
            async () => {
                const h = make()
                h.jobActionService.getJob.mockResolvedValue(h.job)
                h.step.process.mockRejectedValue("encoder unavailable")

                await expect(h.worker.process(bull())).rejects.toBe("encoder unavailable")
                expect(h.jobActionService.failJob).toHaveBeenCalledWith({
                    job: h.job,
                    error: "encoder unavailable",
                })
            })

        it("reports malformed queue data without starting a step",
            async () => {
                const h = make()
                h.superJson.parse.mockImplementation(() => {
                    throw new Error("invalid encoder payload")
                })

                await expect(h.worker.process(bull())).rejects.toThrow(
                    "invalid encoder payload",
                )
                expect(h.step.process).not.toHaveBeenCalled()
                expect(h.jobActionService.completeJob).not.toHaveBeenCalled()
            })
    })
