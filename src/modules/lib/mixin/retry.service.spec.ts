import {
    RetryService,
} from "./retry.service"

describe("RetryService",
    () => {
        it("retries a transient action and returns its eventual value",
            async () => {
                let attempts = 0
                const action = jest.fn(async () => {
                    attempts += 1
                    if (attempts === 1) {
                        throw new Error("transient")
                    }
                    return "ready"
                })

                await expect(new RetryService().retry({
                    action,
                    options: {
                        retries: 1,
                        minTimeout: 0,
                        maxTimeout: 0,
                    },
                })).resolves.toBe("ready")
                expect(action).toHaveBeenCalledTimes(2)
            })

        it("surfaces the final failure when retries are disabled",
            async () => {
                const failure = new Error("permanent")
                const action = jest.fn().mockRejectedValue(failure)

                await expect(new RetryService().retry({
                    action,
                    options: {
                        retries: 0,
                    },
                })).rejects.toBe(failure)
                expect(action).toHaveBeenCalledTimes(1)
            })
    })
