import {
    ReadinessWatcherFactoryService
} from "./readiness-watcher-factory.service"
import {
    ReadinessWatcherAlreadyExistsException
} from "@modules/platform/exceptions/errors/mixin/readiness-watcher-already-exists.exception"
import {
    ReadinessWatcherNotFoundException
} from "@modules/platform/exceptions/errors/mixin/readiness-watcher-not-found.exception"

describe("ReadinessWatcherFactoryService",
    () => {
        it("tracks readiness lifecycle and status",
            async () => {
                const service = new ReadinessWatcherFactoryService()
                const watcher = service.createWatcher("db")
                expect(watcher.state).toBe("pending")
                expect(service.getStatus()).toEqual({
                    db: "pending"
                })
                const waiting = service.waitUntilReady("db")
                service.setReady("db")
                await expect(waiting).resolves.toBeUndefined()
                expect(service.getStatus()).toEqual({
                    db: "ready"
                })
            })

        it("rejects duplicate/missing watchers and propagates errors",
            async () => {
                const service = new ReadinessWatcherFactoryService()
                service.createWatcher("worker")
                expect(() => service.createWatcher("worker")).toThrow(ReadinessWatcherAlreadyExistsException)
                expect(() => service.waitUntilReady("missing")).toThrow(ReadinessWatcherNotFoundException)
                const waiting = service.waitUntilReady("worker")
                const error = new Error("failed")
                service.setErrored("worker",
                    error)
                await expect(waiting).rejects.toBe(error)
                expect(() => service.setReady("missing")).toThrow(ReadinessWatcherNotFoundException)
            })
    })
