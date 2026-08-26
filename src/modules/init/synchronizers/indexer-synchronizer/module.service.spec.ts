import {
    ModuleIndexerSynchronizerService
} from "./module.service"
describe("ModuleIndexerSynchronizerService",
    () => {
        it("runs the module bootstrap trigger once",
            async () => {
                const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                const service = new ModuleIndexerSynchronizerService({
                    now: () => new Date()
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await service.onApplicationBootstrap()
                expect(enqueue.enqueue).toHaveBeenCalledTimes(1)
            })
    })
