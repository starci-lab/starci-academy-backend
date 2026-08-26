import {
    GenerateCvService
} from "./generate-cv.service"

describe("GenerateCvService",
    () => {
        it("delegates CV generation and returns its result",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    jobId: "job-1"
                })
                const params = {
                    user: {
                        id: "u-1"
                    }, request: {
                        templateId: "template-1"
                    }
                }
                await expect(new GenerateCvService({
                    execute
                } as never).execute(params as never)).resolves.toEqual({
                    jobId: "job-1"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
            })
    })
