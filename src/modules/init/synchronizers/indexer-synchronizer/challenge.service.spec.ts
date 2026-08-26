import {
    ChallengeIndexerSynchronizerService
} from "./challenge.service"
describe("ChallengeIndexerSynchronizerService",
    () => {
        it("enqueues bootstrap and interval work",
            async () => {
                const now = new Date(); const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                const service = new ChallengeIndexerSynchronizerService({
                    now: () => now
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await service.onApplicationBootstrap(); await service.handleInterval()
                expect(enqueue.enqueue).toHaveBeenCalledTimes(2)
                expect(enqueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
                    syncAt: now
                }))
            })
        it("propagates interval queue failures",
            async () => { const failure = new Error("challenge queue unavailable"); const enqueue = {
                enqueue: jest.fn().mockRejectedValue(failure)
            }; const service = new ChallengeIndexerSynchronizerService({
                now: () => new Date()
            } as never,
            {
                log: jest.fn()
            } as never,
            enqueue as never); await expect(service.handleInterval()).rejects.toBe(failure); expect(enqueue.enqueue).toHaveBeenCalledTimes(1) })
    })
