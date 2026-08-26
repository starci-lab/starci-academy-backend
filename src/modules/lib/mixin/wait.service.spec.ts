import {
    WaitService
} from "./wait.service"
import {
    WaitTimeoutException
} from "@modules/platform/exceptions/errors/mixin/wait-timeout.exception"
describe("WaitService",
    () => {
        it("returns when the action eventually succeeds",
            async () => {
                const service = new WaitService(); let attempts = 0
                await expect(service.wait({
                    action: async () => ++attempts > 1, maxAttempts: 3, intervalMs: 1
                })).resolves.toBe(true)
            })
        it("returns false or throws on exhaustion",
            async () => {
                const service = new WaitService()
                await expect(service.wait({
                    action: async () => false, maxAttempts: 1, intervalMs: 1
                })).resolves.toBe(false)
                await expect(service.wait({
                    action: async () => false, maxAttempts: 1, intervalMs: 1, throwOnFail: true
                })).rejects.toBeInstanceOf(WaitTimeoutException)
            })
    })
