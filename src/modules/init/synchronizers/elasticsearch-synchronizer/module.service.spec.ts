import {
    ModuleElasticsearchSynchronizerService
} from "./module.service"
describe("ModuleElasticsearchSynchronizerService",
    () => {
        it("propagates an enqueue error from the interval trigger",
            async () => {
                const failure = new Error("elasticsearch unavailable")
                const enqueue = {
                    enqueue: jest.fn().mockRejectedValue(failure)
                }
                const service = new ModuleElasticsearchSynchronizerService({
                    now: () => new Date()
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await expect(service.handleInterval()).rejects.toBe(failure)
            })
    })
