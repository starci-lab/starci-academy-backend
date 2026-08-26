import {
    StartTrialService
} from "./start-trial.service"

describe("StartTrialService",
    () => {
        it("dispatches a trial request and returns its result",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    enrollmentId: "e1"
                })
                const service = new StartTrialService({
                    execute
                } as never)
                const params = {
                    request: {
                        courseId: "c1"
                    }, user: {
                        id: "u1"
                    }
                } as never
                await expect(service.execute(params)).resolves.toEqual({
                    enrollmentId: "e1"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
                execute.mockRejectedValueOnce(new Error("trial unavailable"))
                await expect(service.execute(params)).rejects.toThrow("trial unavailable")
            })
    })
