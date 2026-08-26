import {
    CourseCdnSynchronizerService
} from "./course.service"

describe("CourseCdnSynchronizerService",
    () => {
        it("enqueues the course entity with the current synchronization time",
            async () => {
                const now = new Date("2026-01-01T00:00:00.000Z")
                const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                const service = new CourseCdnSynchronizerService({
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
            })
        it("propagates interval queue failures",
            async () => { const failure = new Error("course CDN queue unavailable"); const enqueue = {
                enqueue: jest.fn().mockRejectedValue(failure)
            }; const service = new CourseCdnSynchronizerService({
                now: () => new Date()
            } as never,
            {
                log: jest.fn()
            } as never,
            enqueue as never); await expect(service.handleInterval()).rejects.toBe(failure); expect(enqueue.enqueue).toHaveBeenCalledTimes(1) })
    })
