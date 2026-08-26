import {
    EmailBloomFiltersSynchronizerService
} from "./email.service"
describe("EmailBloomFiltersSynchronizerService",
    () => {
        it("enqueues a rebuild at the current timestamp",
            async () => {
                const now = new Date(); const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                const service = new EmailBloomFiltersSynchronizerService({
                    now: () => now
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await service.process()
                expect(enqueue.enqueue).toHaveBeenCalledWith({
                    syncAt: now
                })
            })
        it("propagates bloom-filter enqueue failures",
            async () => {
                const failure = new Error("queue unavailable"); const enqueue = {
                    enqueue: jest.fn().mockRejectedValue(failure)
                }
                const service = new EmailBloomFiltersSynchronizerService({
                    now: () => new Date()
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await expect(service.process()).rejects.toBe(failure)
            })
    })
