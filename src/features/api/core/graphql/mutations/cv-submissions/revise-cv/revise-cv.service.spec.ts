import {
    ReviseCvService
} from "./revise-cv.service"

describe("ReviseCvService",
    () => {
        it("delegates revision params and returns the revised result",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    jobId: "job-2"
                })
                const params = {
                    user: {
                        id: "u-1"
                    }, request: {
                        cvId: "cv-1"
                    }
                }
                await expect(new ReviseCvService({
                    execute
                } as never).execute(params as never)).resolves.toEqual({
                    jobId: "job-2"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
            })
    })
