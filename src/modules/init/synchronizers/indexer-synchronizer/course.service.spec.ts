import {
    CourseIndexerSynchronizerService
} from "./course.service"
describe("CourseIndexerSynchronizerService",
    () => {
        it("propagates an indexer enqueue failure",
            async () => {
                const failure = new Error("indexer unavailable"); const enqueue = {
                    enqueue: jest.fn().mockRejectedValue(failure)
                }
                const service = new CourseIndexerSynchronizerService({
                    now: () => new Date()
                } as never,
                {
                    log: jest.fn()
                } as never,
                enqueue as never)
                await expect(service.onApplicationBootstrap()).rejects.toBe(failure)
            })
        it("includes the current time in successful interval work",
            async () => { const now = new Date("2026-08-26T00:00:00.000Z"); const enqueue = {
                enqueue: jest.fn().mockResolvedValue(undefined)
            }; const service = new CourseIndexerSynchronizerService({
                now: () => now
            } as never,
            {
                log: jest.fn()
            } as never,
            enqueue as never); await service.handleInterval(); expect(enqueue.enqueue).toHaveBeenCalledWith({
                entityKind: "CourseEntity", syncAt: now
            }) })
    })
