import {
    ChallengeElasticsearchSynchronizerService
} from "./challenge.service"
describe("ChallengeElasticsearchSynchronizerService",
    () => {
        it("enqueues on bootstrap and propagates queue failures",
            async () => {
                const now = new Date()
                const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                const service = new ChallengeElasticsearchSynchronizerService({
                    now: () => now
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await service.onApplicationBootstrap()
                expect(enqueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
                    syncAt: now
                }))
                enqueue.enqueue.mockRejectedValueOnce(new Error("queue down"))
                await expect(service.handleInterval()).rejects.toThrow("queue down")
            })
    })
