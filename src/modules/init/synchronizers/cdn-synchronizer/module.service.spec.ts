import {
    ModuleCdnSynchronizerService,
} from "./module.service"

describe("ModuleCdnSynchronizerService",
    () => {
        it("enqueues module synchronization on bootstrap and interval",
            async () => {
                const now = new Date("2026-08-26T00:00:00.000Z")
                const enqueue = jest.fn().mockResolvedValue(undefined)
                const service = new ModuleCdnSynchronizerService(
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
                    entityKind: "ModuleEntity",
                    syncAt: now,
                })
            })

        it("propagates queue failures instead of swallowing them",
            async () => {
                const failure = new Error("queue unavailable")
                const service = new ModuleCdnSynchronizerService(
                    {
                        now: jest.fn(),
                    } as never,
                    {
                        enqueue: jest.fn().mockRejectedValue(failure),
                    } as never,
                )

                await expect(service.onApplicationBootstrap()).rejects.toBe(failure)
            })
    })
