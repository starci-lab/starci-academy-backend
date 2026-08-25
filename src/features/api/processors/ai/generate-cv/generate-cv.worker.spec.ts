import type {
    Job 
} from "bullmq"
import {
    GenerateCvWorker 
} from "./generate-cv.worker"
import {
    UserCvGenerationEntity 
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    CvGenerationStatus 
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import {
    CvGenerationNotFoundException 
} from "@modules/platform/exceptions/errors/api/cv-generation-not-found"
import {
    StepNotFoundException 
} from "@modules/platform/exceptions/errors/job/not-found"
const bull = (): Job<string> =>
  ({
      id: "b1", data: "serialized", queueName: "cv" 
  }) as unknown as Job<string>
const make = () => {
    const job = {
            id: "j1", currentStep: 0, maxSteps: 2 
        },
        generation = {
            id: "g1", user: {
                id: "u1" 
            } 
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
        },
        superJson: {
            parse: jest.fn().mockReturnValue({
                cvGenerationId: "g1" 
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
            now: jest
                .fn()
                .mockReturnValue({
                    diff: jest.fn().mockReturnValue(2),
                    toDate: jest.fn().mockReturnValue(new Date(0)),
                }),
            from: jest.fn(),
        },
        entityManager: {
            findOne: jest.fn().mockResolvedValue(generation),
            update: jest.fn().mockResolvedValue(undefined),
        },
    }
    return {
        worker: new GenerateCvWorker(
      h.jobActionService as never,
      h.superJson as never,
      h.stepMappingService as never,
      h.winstonService as never,
      h.dayjsService as never,
      h.entityManager as never,
        ),
        ...h,
        job,
        generation,
        step,
    }
}
describe("GenerateCvWorker",
    () => {
        it("runs the CV pipeline and completes",
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
                expect(h.jobActionService.completeJob).toHaveBeenCalled()
            })
        it("marks a parsed generation failed when lookup or processing fails",
            async () => {
                const h = make()
                h.jobActionService.getJob.mockResolvedValue(h.job)
                h.entityManager.findOne.mockResolvedValue(null)
                await expect(h.worker.process(bull())).rejects.toThrow(
                    CvGenerationNotFoundException,
                )
                expect(h.entityManager.update).toHaveBeenCalledWith(
                    UserCvGenerationEntity,
                    {
                        id: "g1" 
                    },
                    expect.objectContaining({
                        status: CvGenerationStatus.Failed,
                        errorMessage: "CV generation not found",
                    }),
                )
            })
        it("reports an unmapped step and still attempts failure update",
            async () => {
                const h = make()
                h.jobActionService.getJob
                    .mockResolvedValueOnce(h.job)
                    .mockResolvedValueOnce({
                        ...h.job, currentStep: 4 
                    })
                h.stepMappingService.getStepMap.mockReturnValue(new Map())
                await expect(h.worker.process(bull())).rejects.toThrow(
                    StepNotFoundException,
                )
                expect(h.entityManager.update).toHaveBeenCalledWith(
                    UserCvGenerationEntity,
                    expect.anything(),
                    expect.objectContaining({
                        status: CvGenerationStatus.Failed 
                    }),
                )
            })
    })
