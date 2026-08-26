import {
    ContentElasticsearchSynchronizerService
} from "./content.service"
describe("ContentElasticsearchSynchronizerService",
    () => {
        it("delegates interval work with a fresh timestamp",
            async () => {
                const now = new Date()
                const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                const service = new ContentElasticsearchSynchronizerService({
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
