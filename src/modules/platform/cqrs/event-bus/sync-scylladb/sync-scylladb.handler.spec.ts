import {
    SyncScyllaDBEventHandler,
} from "./sync-scylladb.handler"
import {
    SyncScyllaDBEvent,
} from "./sync-scylladb.event"

describe("SyncScyllaDBEventHandler",
    () => {
        it("enqueues the requested entity and records the queued event",
            async () => {
                const enqueue = jest.fn().mockResolvedValue(undefined)
                const log = jest.fn()
                const handler = new SyncScyllaDBEventHandler(
                    {
                        enqueue,
                    } as never,
                    {
                        log,
                    } as never,
                )
                const event = new SyncScyllaDBEvent({
                    entityType: "content",
                    id: "content-1",
                })

                await expect(handler.execute(event)).resolves.toBeUndefined()

                expect(enqueue).toHaveBeenCalledWith({
                    entityType: "content",
                    id: "content-1",
                })
                expect(log).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        meta: {
                            entityType: "content",
                            id: "content-1",
                        },
                    }),
                )
            })

        it("propagates enqueue failures without claiming the event was queued",
            async () => {
                const failure = new Error("queue unavailable")
                const log = jest.fn()
                const handler = new SyncScyllaDBEventHandler(
                    {
                        enqueue: jest.fn().mockRejectedValue(failure),
                    } as never,
                    {
                        log,
                    } as never,
                )

                await expect(handler.execute(new SyncScyllaDBEvent({
                    entityType: "course",
                    id: "course-1",
                }))).rejects.toBe(failure)
                expect(log).not.toHaveBeenCalled()
            })
    })
