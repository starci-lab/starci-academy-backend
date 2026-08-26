import {
    ContentIndexerSynchronizerService
} from "./content.service"
describe("ContentIndexerSynchronizerService",
    () => {
        it("passes the current clock value to the indexer job",
            async () => {
                const now = new Date(); const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                const service = new ContentIndexerSynchronizerService({
                    now: () => now
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await service.handleInterval()
                expect(enqueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
                    syncAt: now
                }))
            })
        it("propagates interval queue failures",
            async () => { const failure = new Error("content queue unavailable"); const enqueue = {
                enqueue: jest.fn().mockRejectedValue(failure)
            }; const service = new ContentIndexerSynchronizerService({
                now: () => new Date()
            } as never,
            {
                log: jest.fn()
            } as never,
            enqueue as never); await expect(service.handleInterval()).rejects.toBe(failure); expect(enqueue.enqueue).toHaveBeenCalledTimes(1) })
    })
