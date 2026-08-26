import {
    ChallengeCdnSynchronizerService
} from "./challenge.service"

describe("ChallengeCdnSynchronizerService",
    () => {
        it("enqueues a synchronization on bootstrap and interval",
            async () => {
                const now = new Date("2026-01-01T00:00:00.000Z")
                const dayjs = {
                    now: jest.fn(() => now)
                }
                const logger = {
                    log: jest.fn()
                }
                const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                const service = new ChallengeCdnSynchronizerService(dayjs as never,
logger as never,
enqueue as never)
                await service.onApplicationBootstrap()
                await service.handleInterval()
                expect(enqueue.enqueue).toHaveBeenCalledTimes(2)
                expect(enqueue.enqueue.mock.calls[0][0]).toMatchObject({
                    syncAt: now
                })
                expect(logger.log).toHaveBeenCalled()
            })

        it("propagates enqueue failures so the scheduler can observe them",
            async () => {
                const failure = new Error("queue unavailable")
                const enqueue = {
                    enqueue: jest.fn().mockRejectedValue(failure)
                }
                const service = new ChallengeCdnSynchronizerService({
                    now: () => new Date()
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await expect(service.handleInterval()).rejects.toBe(failure)
            })
    })
