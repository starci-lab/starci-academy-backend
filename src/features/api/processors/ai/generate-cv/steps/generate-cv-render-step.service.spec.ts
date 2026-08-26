import {
    GenerateCvRenderStepService
} from "./generate-cv-render-step.service"
import {
    CvGenerationStepResultMissingException
} from "@modules/platform/exceptions/errors/cv/cv-generation-step-result-missing"

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
    })
