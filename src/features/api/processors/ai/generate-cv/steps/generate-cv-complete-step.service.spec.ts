import {
    CvGenerationStepResultMissingException,
} from "@modules/platform/exceptions/errors/cv/cv-generation-step-result-missing"
import {
    JobFencedOutException,
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    CvGenerationStatus,
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import {
    GenerateCvCompleteStepService,
} from "./generate-cv-complete-step.service"

describe("GenerateCvCompleteStepService",
    () => {
        const composed = {
            fullName: "Ada Lovelace",
            headline: "Engineer",
            summary: "Builds reliable systems",
            skillGroups: [],
            experiences: [],
            education: [],
        }
        const rendered = {
            latexCdnKey: "cv/ada.tex",
            pdfCdnKey: null,
        }

        const createSetup = () => {
            const entityManager = {
                transaction: jest.fn(
                    async (callback: (manager: unknown) => Promise<void>) =>
                        callback(entityManager),
                ),
                update: jest.fn().mockResolvedValue({
                    affected: 1,
                }),
            }
            const jobActionService = {
                loadExecutionResult: jest.fn()
                    .mockResolvedValueOnce(composed)
                    .mockResolvedValueOnce(rendered),
                increaseJob: jest.fn().mockResolvedValue(undefined),
                saveExecutionResult: jest.fn().mockResolvedValue(undefined),
            }
            const winstonService = {
                log: jest.fn(),
            }
            const dayjsService = {
                now: jest.fn().mockReturnValue({
                    toDate: () => new Date("2026-08-26T00:00:00.000Z"),
                }),
            }
            const service = new GenerateCvCompleteStepService(
                entityManager as never,
                jobActionService as never,
                winstonService as never,
                dayjsService as never,
            )
            return {
                service,
                entityManager,
                jobActionService,
                winstonService,
            }
        }

        const context = {
            payload: {
                cvGenerationId: "cv-1",
            },
            job: {
                id: "job-1",
                fencingToken: 4,
            },
            queueName: "cv-generation",
            extended: {
            },
        }

        it("finalizes the generation and advances the fenced job atomically",
            async () => {
                const setup = createSetup()

                await setup.service.process(context as never)

                expect(setup.entityManager.transaction).toHaveBeenCalledTimes(1)
                expect(setup.entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: "cv-1",
                    },
                    expect.objectContaining({
                        status: CvGenerationStatus.Done,
                        structuredData: composed,
                        latexCdnKey: rendered.latexCdnKey,
                        generatedPdfCdnKey: null,
                        errorMessage: null,
                    }),
                )
                expect(setup.jobActionService.increaseJob).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job: context.job,
                        expectedFencingToken: 4,
                    }),
                )
                expect(setup.jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "complete",
                    }),
                )
                expect(setup.winstonService.log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        success: true,
                        step: "complete",
                    }),
                )
            })

        it("rejects when compose or render results are missing",
            async () => {
                const missingCompose = createSetup()
                missingCompose.jobActionService.loadExecutionResult
                    .mockReset()
                    .mockResolvedValueOnce(null)
                await expect(missingCompose.service.process(context as never))
                    .rejects.toBeInstanceOf(CvGenerationStepResultMissingException)
                expect(missingCompose.entityManager.transaction).not.toHaveBeenCalled()

                const missingRender = createSetup()
                missingRender.jobActionService.loadExecutionResult
                    .mockReset()
                    .mockResolvedValueOnce(composed)
                    .mockResolvedValueOnce({
                        pdfCdnKey: "cv/ada.pdf",
                    })
                await expect(missingRender.service.process(context as never))
                    .rejects.toBeInstanceOf(CvGenerationStepResultMissingException)
                expect(missingRender.entityManager.transaction).not.toHaveBeenCalled()
            })

        it("treats a fencing loss as an idempotent no-op",
            async () => {
                const setup = createSetup()
                setup.jobActionService.increaseJob.mockRejectedValueOnce(
                    new JobFencedOutException({
                        id: "job-1",
                        expectedFencingToken: 4,
                    }),
                )

                await expect(setup.service.process(context as never)).resolves.toBeUndefined()
                expect(setup.winstonService.log).not.toHaveBeenCalled()
            })

        it("propagates non-fencing transaction failures",
            async () => {
                const setup = createSetup()
                const failure = new Error("database unavailable")
                setup.entityManager.transaction.mockRejectedValueOnce(failure)

                await expect(setup.service.process(context as never)).rejects.toBe(failure)
                expect(setup.winstonService.log).not.toHaveBeenCalled()
            })

        it("does not update the generation when the render result is absent",
            async () => {
                const setup = createSetup()
                setup.jobActionService.loadExecutionResult.mockReset()
                setup.jobActionService.loadExecutionResult
                    .mockResolvedValueOnce(composed)
                    .mockResolvedValueOnce(null)

                await expect(setup.service.process(context as never)).rejects.toBeInstanceOf(
                    CvGenerationStepResultMissingException,
                )
                expect(setup.entityManager.update).not.toHaveBeenCalled()
            })
    })
