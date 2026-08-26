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
    })
