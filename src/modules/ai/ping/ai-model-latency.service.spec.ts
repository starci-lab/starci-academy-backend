import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelLatencyCacheService,
} from "@modules/integrations/cache/ai-model-latency-cache.service"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    AiModelCatalogService,
} from "../balancer/ai-model-catalog.service"
import {
    UseApiService,
} from "../balancer/use-api.service"
import {
    AiModelLatencyService,
} from "./ai-model-latency.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"

// `envConfig()` is a plain factory fn read at boot + per-probe; partially mock
// the env module so each test can dial scope/enabled/cadence freely while the
// REAL config (cache ttl etc., read at import time by sibling modules) still works.
jest.mock("@modules/platform/env/config",
    () => {
        const actual = jest.requireActual<typeof import("@modules/platform/env/config")>("@modules/platform/env/config")
        return {
            ...actual,
            envConfig: jest.fn(actual.envConfig),
        }
    })

const mockEnvConfig = envConfig as jest.MockedFunction<typeof envConfig>

/** Build a fake catalog row with just the fields the SUT touches. */
const makeModel = (
    name: string,
    provider: ModelProvider,
    category: AiModelCategory,
): AiModelEntity =>
    ({
        name,
        provider,
        category,
    } as unknown as AiModelEntity)

/** Stub the env latencyProbe block; overrides merge over sane defaults. */
const setEnv = (overrides: Partial<{
    enabled: boolean
    scope: string
    cycleIntervalMs: number
    staggerMs: number
    timeoutMs: number
}> = {
}): void => {
    mockEnvConfig.mockReturnValue({
        ai: {
            latencyProbe: {
                enabled: true,
                scope: "all",
                cycleIntervalMs: 1_000_000,
                staggerMs: 100,
                timeoutMs: 15_000,
                ...overrides,
            },
        },
    } as unknown as ReturnType<typeof envConfig>)
}

describe("AiModelLatencyService",
    () => {
        let module: TestingModule
        let service: AiModelLatencyService
        let useApiService: jest.Mocked<Pick<UseApiService, "probeModel">>
        let aiModelCatalogService: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>
        let aiModelLatencyCacheService: jest.Mocked<
            Pick<AiModelLatencyCacheService, "recordModelLatency" | "getAll">
        >
        let eventEmitterService: jest.Mocked<Pick<EventEmitterService, "emit">>

        beforeEach(async () => {
            jest.useFakeTimers()
            setEnv()

            useApiService = {
                probeModel: jest.fn(async () => ({
                    ok: true,
                    latencyMs: 42,
                    errorMessage: null,
                })),
            } as unknown as jest.Mocked<Pick<UseApiService, "probeModel">>

            aiModelCatalogService = {
                enabledModels: jest.fn(async () => []),
            } as unknown as jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

            aiModelLatencyCacheService = {
                recordModelLatency: jest.fn(async () => undefined),
                getAll: jest.fn(async () => ({
                })),
            } as unknown as jest.Mocked<
                Pick<AiModelLatencyCacheService, "recordModelLatency" | "getAll">
            >

            eventEmitterService = {
                emit: jest.fn(async () => undefined),
            } as unknown as jest.Mocked<Pick<EventEmitterService, "emit">>

            module = await Test.createTestingModule({
                providers: [
                    AiModelLatencyService,
                    {
                        provide: UseApiService,
                        useValue: useApiService,
                    },
                    {
                        provide: AiModelCatalogService,
                        useValue: aiModelCatalogService,
                    },
                    {
                        provide: AiModelLatencyCacheService,
                        useValue: aiModelLatencyCacheService,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            service = module.get<AiModelLatencyService>(AiModelLatencyService)
        })

        afterEach(async () => {
            // tear down so cycle/stagger timers never leak between tests
            service.onModuleDestroy()
            jest.clearAllTimers()
            jest.useRealTimers()
            await module.close()
        })

        describe("runCycle",
            () => {
                it("skips an overlapping cycle while the prior timers are still active",
                    async () => {
                        Object.defineProperty(service,
                            "cycleInProgress",
                            {
                                value: true,
                                writable: true,
                            })

                        await service.runCycle()

                        expect(aiModelCatalogService.enabledModels).not.toHaveBeenCalled()
                    })

                it("schedules a staggered probe per in-scope model + records each snapshot",
                    async () => {
                        const models = [
                            makeModel("m-0",
                                ModelProvider.OpenAI,
                                AiModelCategory.High),
                            makeModel("m-1",
                                ModelProvider.Gemini,
                                AiModelCategory.Medium),
                            makeModel("m-2",
                                ModelProvider.Local,
                                AiModelCategory.Low),
                        ]
                        aiModelCatalogService.enabledModels.mockResolvedValue(models)

                        // schedule the cycle (sets up setTimeout handles, no probe yet)
                        await service.runCycle()
                        expect(useApiService.probeModel).not.toHaveBeenCalled()

                        // drain every staggered timer + its async callbacks
                        await jest.runAllTimersAsync()

                        // one probe per model, with the per-model provider/name + timeout
                        expect(useApiService.probeModel).toHaveBeenCalledTimes(3)
                        expect(useApiService.probeModel).toHaveBeenNthCalledWith(1,
                            {
                                provider: ModelProvider.OpenAI,
                                model: "m-0",
                                timeoutMs: 15_000,
                            })
                        expect(useApiService.probeModel).toHaveBeenNthCalledWith(3,
                            {
                                provider: ModelProvider.Local,
                                model: "m-2",
                                timeoutMs: 15_000,
                            })

                        // each probe outcome persisted to the latency cache
                        expect(aiModelLatencyCacheService.recordModelLatency).toHaveBeenCalledTimes(3)
                        expect(aiModelLatencyCacheService.recordModelLatency).toHaveBeenCalledWith({
                            model: "m-1",
                            provider: ModelProvider.Gemini,
                            ok: true,
                            latencyMs: 42,
                            errorMessage: null,
                        })
                    })

                it("on the LAST model flips cycleInProgress off + emits the full snapshot",
                    async () => {
                        const models = [
                            makeModel("m-0",
                                ModelProvider.OpenAI,
                                AiModelCategory.High),
                            makeModel("m-1",
                                ModelProvider.Local,
                                AiModelCategory.Low),
                        ]
                        aiModelCatalogService.enabledModels.mockResolvedValue(models)

                        // cache holds both snapshots written this cycle; category comes
                        // from the enabled catalog, attached during emitSnapshot
                        aiModelLatencyCacheService.getAll.mockResolvedValue({
                            "m-0": {
                                provider: ModelProvider.OpenAI,
                                ok: true,
                                latencyMs: 30,
                                checkedAt: "2026-06-30T00:00:00.000Z",
                                errorMessage: null,
                            },
                            "m-1": {
                                provider: ModelProvider.Local,
                                ok: false,
                                latencyMs: 0,
                                checkedAt: "2026-06-30T00:00:01.000Z",
                                errorMessage: "boom",
                            },
                        })

                        await service.runCycle()
                        await jest.runAllTimersAsync()

                        // snapshot broadcast exactly once with the full per-model array
                        expect(eventEmitterService.emit).toHaveBeenCalledTimes(1)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.AiModelHealthUpdated,
                            payload: {
                                models: [
                                    {
                                        name: "m-0",
                                        provider: ModelProvider.OpenAI,
                                        category: AiModelCategory.High,
                                        ok: true,
                                        latencyMs: 30,
                                        checkedAt: "2026-06-30T00:00:00.000Z",
                                        errorMessage: null,
                                    },
                                    {
                                        name: "m-1",
                                        provider: ModelProvider.Local,
                                        category: AiModelCategory.Low,
                                        ok: false,
                                        latencyMs: 0,
                                        checkedAt: "2026-06-30T00:00:01.000Z",
                                        errorMessage: "boom",
                                    },
                                ],
                            },
                        })

                        // cycle lock released -> a fresh cycle can schedule again
                        useApiService.probeModel.mockClear()
                        await service.runCycle()
                        await jest.runAllTimersAsync()
                        expect(useApiService.probeModel).toHaveBeenCalled()
                    })

                it("catches a probe that THROWS → safeRecordDown, cycle continues",
                    async () => {
                        const models = [
                            makeModel("m-0",
                                ModelProvider.OpenAI,
                                AiModelCategory.High),
                            makeModel("m-1",
                                ModelProvider.Gemini,
                                AiModelCategory.Medium),
                        ]
                        aiModelCatalogService.enabledModels.mockResolvedValue(models)

                        // first probe explodes, second is fine -- the cycle must survive
                        useApiService.probeModel
                            .mockRejectedValueOnce(new Error("network down"))
                            .mockResolvedValueOnce({
                                ok: true,
                                latencyMs: 50,
                                errorMessage: null,
                            })

                        await service.runCycle()
                        await jest.runAllTimersAsync()

                        // both models attempted (the throw did not abort the rest)
                        expect(useApiService.probeModel).toHaveBeenCalledTimes(2)

                        // the thrown model is recorded DOWN (non-fatal) via safeRecordDown
                        expect(aiModelLatencyCacheService.recordModelLatency).toHaveBeenCalledWith({
                            model: "m-0",
                            provider: ModelProvider.OpenAI,
                            ok: false,
                            latencyMs: 0,
                            errorMessage: "Probe threw before completing",
                        })

                        // healthy second model still recorded normally
                        expect(aiModelLatencyCacheService.recordModelLatency).toHaveBeenCalledWith({
                            model: "m-1",
                            provider: ModelProvider.Gemini,
                            ok: true,
                            latencyMs: 50,
                            errorMessage: null,
                        })

                        // cycle still closes + emits (last model was healthy)
                        expect(eventEmitterService.emit).toHaveBeenCalledTimes(1)
                    })

                it("does nothing when no models are in scope (empty catalog)",
                    async () => {
                        aiModelCatalogService.enabledModels.mockResolvedValue([])

                        await service.runCycle()
                        await jest.runAllTimersAsync()

                        expect(useApiService.probeModel).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })
            })

        describe("scope filtering",
            () => {
                it("scope=freeLocal probes only Local-provider OR Free-category models",
                    async () => {
                        setEnv({
                            scope: "freeLocal",
                        })
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            makeModel("local-x",
                                ModelProvider.Local,
                                AiModelCategory.High),
                            makeModel("free-x",
                                ModelProvider.OpenAI,
                                AiModelCategory.Low),
                            makeModel("paid-x",
                                ModelProvider.OpenAI,
                                AiModelCategory.High),
                        ])

                        await service.runCycle()
                        await jest.runAllTimersAsync()

                        // paid-x filtered out; only the local + free models probed
                        const probedModels = useApiService.probeModel.mock.calls.map(
                            ([params]) => params.model,
                        )
                        expect(probedModels).toEqual([
                            "local-x",
                            "free-x",
                        ])
                    })

                it("scope=all probes every enabled model (no filtering)",
                    async () => {
                        setEnv({
                            scope: "all",
                        })
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            makeModel("a",
                                ModelProvider.OpenAI,
                                AiModelCategory.High),
                            makeModel("b",
                                ModelProvider.Anthropic,
                                AiModelCategory.High),
                        ])

                        await service.runCycle()
                        await jest.runAllTimersAsync()

                        expect(useApiService.probeModel).toHaveBeenCalledTimes(2)
                    })
            })

        describe("onModuleInit scheduler gate",
            () => {
                it("disabled (enabled:false) → scheduler stays idle (no cycle)",
                    () => {
                        setEnv({
                            enabled: false,
                        })

                        service.onModuleInit()

                        // no immediate cycle: catalog never queried, no timers armed
                        expect(aiModelCatalogService.enabledModels).not.toHaveBeenCalled()
                    })

                it("enabled → runs a cycle immediately on boot",
                    async () => {
                        setEnv({
                            enabled: true,
                        })
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            makeModel("a",
                                ModelProvider.OpenAI,
                                AiModelCategory.High),
                        ])

                        service.onModuleInit()
                        // let the boot runCycle resolve its listModelsInScope
                        await Promise.resolve()
                        await Promise.resolve()

                        expect(aiModelCatalogService.enabledModels).toHaveBeenCalled()
                    })

                it("cancels staggered probes when the service is destroyed",
                    async () => {
                        setEnv({
                            enabled: true,
                        })
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            makeModel("pending-model",
                                ModelProvider.OpenAI,
                                AiModelCategory.High),
                        ])

                        await service.runCycle()
                        service.onModuleDestroy()
                        await jest.runAllTimersAsync()

                        expect(useApiService.probeModel).not.toHaveBeenCalled()
                    })
            })
    })
