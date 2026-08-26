import {
    GenerateCvRenderStepService
} from "./generate-cv-render-step.service"
import {
    CvGenerationStepResultMissingException
} from "@modules/platform/exceptions/errors/cv/cv-generation-step-result-missing"
import {
    compileCvPdf,
} from "./compile-cv-pdf"

jest.mock("./compile-cv-pdf",
    () => ({
        compileCvPdf: jest.fn(),
    }))

describe("GenerateCvRenderStepService",
    () => {
        it("fails the job when the compose step result is missing",
            async () => {
                const action = {
                    loadExecutionResult: jest.fn().mockResolvedValue(null), failJob: jest.fn().mockResolvedValue(undefined)
                }
                const service = new GenerateCvRenderStepService({
                } as never,
action as never,
{
} as never,
{
} as never)
                const context = {
                    payload: {
                        userId: "u"
                    }, job: {
                        id: "job"
                    }
                }
                await expect(service.process(context as never)).rejects.toBeInstanceOf(CvGenerationStepResultMissingException)
                expect(action.failJob).toHaveBeenCalledWith(expect.objectContaining({
                    job: context.job
                }))
            })
        it("uploads both the rendered tex and compiled pdf, then finalizes",
            async () => {
                const action = {
                    loadExecutionResult: jest.fn().mockResolvedValue({
                        fullName: "Ada Lovelace",
                        headline: "Engineer",
                        summary: "Builds things",
                        skillGroups: [],
                        experiences: [],
                        education: [],
                    }),
                    increaseJob: jest.fn().mockResolvedValue(undefined),
                    saveExecutionResult: jest.fn().mockResolvedValue(undefined),
                    failJob: jest.fn().mockResolvedValue(undefined),
                }
                const manager = {
                    transaction: jest.fn(async (callback: (value: unknown) => Promise<void>) => callback({
                    })),
                }
                const upload = {
                    buffer: jest.fn().mockResolvedValue(undefined),
                }
                const logger = {
                    log: jest.fn(),
                }
                const service = new GenerateCvRenderStepService(manager as never,
                    action as never,
                    logger as never,
                    upload as never)
                jest.mocked(compileCvPdf).mockResolvedValue(Buffer.from("pdf"))

                await service.process({
                    payload: {
                        userId: "u",
                    },
                    job: {
                        id: "job",
                    },
                    queueName: "cv",
                    extended: {
                        cvGeneration: {
                            user: {
                                githubUsername: "ada",
                                linkedinUrl: "https://linkedin.test/ada",
                                location: "London",
                            },
                        },
                    },
                } as never)

                expect(upload.buffer).toHaveBeenCalledTimes(2)
                expect(upload.buffer).toHaveBeenNthCalledWith(2,
                    expect.objectContaining({
                        name: "cv-generations/u/job.pdf",
                        contentType: "application/pdf",
                        buffer: Buffer.from("pdf"),
                    }))
                expect(action.increaseJob).toHaveBeenCalledTimes(1)
                expect(action.saveExecutionResult).toHaveBeenCalledWith(expect.objectContaining({
                    key: "render",
                    executionResult: {
                        latexCdnKey: "cv-generations/u/job.tex",
                        pdfCdnKey: "cv-generations/u/job.pdf",
                    },
                }))
                expect(logger.log).toHaveBeenLastCalledWith(expect.anything(),
                    expect.objectContaining({
                        success: true,
                    }))
            })
        it("degrades to tex when compilation returns no pdf and logs the failure",
            async () => {
                const action = {
                    loadExecutionResult: jest.fn().mockResolvedValue({
                        fullName: "Grace Hopper",
                        headline: "Compiler pioneer",
                        summary: "",
                        skillGroups: [],
                        experiences: [],
                        education: [],
                    }),
                    increaseJob: jest.fn().mockResolvedValue(undefined),
                    saveExecutionResult: jest.fn().mockResolvedValue(undefined),
                    failJob: jest.fn().mockResolvedValue(undefined),
                }
                const manager = {
                    transaction: jest.fn(async (callback: (value: unknown) => Promise<void>) => callback({
                    })),
                }
                const upload = {
                    buffer: jest.fn().mockResolvedValue(undefined),
                }
                const logger = {
                    log: jest.fn(),
                }
                const service = new GenerateCvRenderStepService(manager as never,
                    action as never,
                    logger as never,
                    upload as never)
                jest.mocked(compileCvPdf).mockResolvedValue(null)

                await service.process({
                    payload: {
                        userId: "u",
                    },
                    job: {
                        id: undefined,
                    },
                    queueName: "cv",
                } as never)

                expect(upload.buffer).toHaveBeenCalledTimes(1)
                expect(action.saveExecutionResult).toHaveBeenCalledWith(expect.objectContaining({
                    executionResult: {
                        latexCdnKey: "cv-generations/u/undefined.tex",
                        pdfCdnKey: null,
                    },
                }))
                expect(logger.log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        success: false,
                        error: expect.stringContaining("PDF compile failed"),
                    }))
                expect(action.failJob).not.toHaveBeenCalled()
            })
    })
