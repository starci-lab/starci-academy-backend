import {
    AbstractProviderPingService
} from "./abstract-provider-ping.service"
import {
    ModelProvider
} from "@modules/databases/postgresql/primary/enums/model-provider"

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
    })
