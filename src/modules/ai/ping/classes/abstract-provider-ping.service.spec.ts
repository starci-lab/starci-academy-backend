import {
    AbstractProviderPingService
} from "./abstract-provider-ping.service"
import {
    ModelProvider
} from "@modules/databases/postgresql/primary/enums/model-provider"

const mockPingConfig = {
    enabled: false,
    cycleIntervalMs: 1000,
    keyStaggerMs: 0,
}
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            ai: {
                ping: mockPingConfig,
            },
        }),
    }))

class TestPingService extends AbstractProviderPingService {
    protected readonly provider = ModelProvider.OpenAI
    execute = jest.fn().mockResolvedValue({
        success: true, errorMessage: null
    })
    keys: Array<string> = [" a ",
        "",
        "a",
        "b"]
    protected executePing(key: string) { return this.execute(key) }
    protected listMountKeys() { return this.keys }
}

describe("AbstractProviderPingService",
    () => {
        const make = () => {
            const service = new TestPingService({
                emit: jest.fn()
            } as never,
{
    log: jest.fn()
} as never,
{
    recordPingKeyStatus: jest.fn()
} as never)
            return service
        }
        it("deduplicates keys and records a direct ping",
            async () => {
                const service = make()
                await expect(service.ping("key")).resolves.toEqual({
                    success: true, errorMessage: null
                })
                expect(service.execute).toHaveBeenCalledWith("key")
                expect(service.listKeys()).toEqual(["a",
                    "b"])
            })
        it("does not schedule a sweep when no mount keys exist",
            async () => {
                const service = make()
                service.keys = []
                await service.runSweep()
                expect(service.execute).not.toHaveBeenCalled()
            })
        it("records failed direct pings without emitting a success heartbeat",
            async () => {
                const service = make()
                service.execute.mockResolvedValueOnce({
                    success: false,
                    errorMessage: "unauthorized",
                })

                await expect(service.ping("bad-key")).resolves.toEqual({
                    success: false,
                    errorMessage: "unauthorized",
                })
            })
        it("schedules each key, emits success heartbeat, and clears timers on destroy",
            async () => {
                jest.useFakeTimers()
                mockPingConfig.enabled = true
                mockPingConfig.keyStaggerMs = 5
                const eventEmitter = {
                    emit: jest.fn().mockResolvedValue(undefined),
                }
                const logger = {
                    log: jest.fn(),
                }
                const cache = {
                    recordPingKeyStatus: jest.fn().mockResolvedValue(undefined),
                }
                const service = new TestPingService(eventEmitter as never,
                    logger as never,
                    cache as never)
                service.keys = ["first",
                    "second"]

                service.onModuleInit()
                expect(jest.getTimerCount()).toBe(3)
                await jest.advanceTimersByTimeAsync(5)
                expect(service.execute).toHaveBeenCalledWith("first")
                expect(service.execute).toHaveBeenCalledWith("second")
                expect(eventEmitter.emit).toHaveBeenCalled()
                service.onModuleDestroy()
                expect(jest.getTimerCount()).toBe(0)
                mockPingConfig.enabled = false
                jest.useRealTimers()
            })
    })
