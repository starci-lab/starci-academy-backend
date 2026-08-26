import {
    ContentCdnSynchronizerService,
} from "./content.service"

describe("ContentCdnSynchronizerService",
    () => {
        it("enqueues content synchronization on bootstrap and interval",
            async () => {
                const now = new Date("2026-08-26T00:00:00.000Z")
                const enqueue = jest.fn().mockResolvedValue(undefined)
                const service = new ContentCdnSynchronizerService(
                    {
                        now: jest.fn().mockReturnValue(now),
                    } as never,
                    {
                        enqueue,
                    } as never,
                )

                await service.onApplicationBootstrap()
                await service.handleInterval()

                expect(enqueue).toHaveBeenCalledTimes(2)
                expect(enqueue).toHaveBeenCalledWith({
                    entityKind: "ContentEntity",
                    syncAt: now,
                })
            })

        it("propagates queue failures to the scheduler",
            async () => {
                const failure = new Error("queue unavailable")
                const service = new ContentCdnSynchronizerService(
                    {
                        now: jest.fn(),
                    } as never,
                    {
                        enqueue: jest.fn().mockRejectedValue(failure),
                    } as never,
                )

                await expect(service.handleInterval()).rejects.toBe(failure)
            })
    })
