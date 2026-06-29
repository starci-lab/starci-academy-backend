import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelLatencyCacheService,
    AiPingCacheService,
} from "@modules/cache"
import {
    AiMode,
    AiModelEntity,
    ModelProvider,
} from "@modules/databases"
import {
    AllModelsExhaustedException,
    NoActiveBalancerKeyException,
    UnsupportedAiProviderException,
} from "@modules/exceptions"
import {
    UseApiService,
} from "./use-api.service"
import {
    AiModelCatalogService,
} from "./ai-model-catalog.service"
import {
    AiBalancerService,
} from "./ai-balancer.service"
import {
    KeyStoreService,
} from "./key-store.service"
import {
    WinstonService,
} from "@modules/winston"

/** Build an enabled catalog row with a name + provider. */
const buildModelRow = (
    name: string,
    provider: ModelProvider = ModelProvider.OpenAI,
): AiModelEntity => ({
    name,
    provider,
} as AiModelEntity)

describe("UseApiService",
    () => {
        let module: TestingModule
        let service: UseApiService
        let aiModelCatalogService: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>
        let aiBalancerService: jest.Mocked<Pick<AiBalancerService, "acquire">>
        let aiPingCacheService: jest.Mocked<
            Pick<AiPingCacheService, "getProviderMap" | "recordKeySuccess" | "recordKeyCooldown">
        >
        let keyStoreService: jest.Mocked<Pick<KeyStoreService, "ensureLoaded" | "getPool">>

        beforeEach(async () => {
            // catalog: a single OpenAI model by default
            aiModelCatalogService = {
                enabledModels: jest.fn(async () => [
                    buildModelRow("gpt-4o"),
                ]),
            } as unknown as jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

            // balancer: always hands back a usable key
            aiBalancerService = {
                acquire: jest.fn(async () => ({
                    value: "sk-aaaa",
                    handle: {
                        provider: ModelProvider.OpenAI,
                        keySuffix: "aaaa",
                    },
                })),
            } as unknown as jest.Mocked<Pick<AiBalancerService, "acquire">>

            // ping cache: empty map → every key eligible; record is a no-op spy
            aiPingCacheService = {
                getProviderMap: jest.fn(async () => ({
                })),
                recordKeySuccess: jest.fn(async () => undefined),
                recordKeyCooldown: jest.fn(async () => undefined),
            } as unknown as jest.Mocked<
                Pick<AiPingCacheService, "getProviderMap" | "recordKeySuccess" | "recordKeyCooldown">
            >

            // store: one loaded key per provider
            keyStoreService = {
                ensureLoaded: jest.fn(async () => undefined),
                getPool: jest.fn(() => [
                    {
                        value: "sk-aaaa",
                    },
                ]),
            } as unknown as jest.Mocked<Pick<KeyStoreService, "ensureLoaded" | "getPool">>

            module = await Test.createTestingModule({
                providers: [
                    UseApiService,
                    {
                        provide: AiModelCatalogService,
                        useValue: aiModelCatalogService,
                    },
                    {
                        provide: AiBalancerService,
                        useValue: aiBalancerService,
                    },
                    {
                        provide: AiPingCacheService,
                        useValue: aiPingCacheService,
                    },
                    {
                        provide: AiModelLatencyCacheService,
                        useValue: {
                            getAll: jest.fn().mockResolvedValue({}),
                        },
                    },
                    {
                        provide: KeyStoreService,
                        useValue: keyStoreService,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            service = module.get<UseApiService>(UseApiService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("auto lane",
            () => {
                it("returns the result on the first successful invoke",
                    async () => {
                        // the action succeeds immediately on the first key
                        const result = await service.useApi<string>({
                            lane: AiMode.Auto,
                            action: async () => "ok",
                        })

                        expect(result).toMatchObject({
                            result: "ok",
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                            attempts: 1,
                        })
                        // success path marks the key healthy (clears any cooldown)
                        expect(aiPingCacheService.recordKeySuccess).toHaveBeenCalledWith(
                            expect.objectContaining({
                                provider: ModelProvider.OpenAI,
                            }),
                        )
                    })

                it("loads keys lazily before the first attempt",
                    async () => {
                        // every Auto run must ensure the pool is hydrated first
                        await service.useApi<string>({
                            lane: AiMode.Auto,
                            action: async () => "ok",
                        })

                        expect(keyStoreService.ensureLoaded).toHaveBeenCalledTimes(1)
                    })

                it("throws AllModelsExhausted after every attempt fails",
                    async () => {
                        // the action always throws → retry until max attempts → exhausted
                        await expect(
                            service.useApi<string>({
                                lane: AiMode.Auto,
                                action: async () => {
                                    throw new Error("boom")
                                },
                            }),
                        ).rejects.toBeInstanceOf(AllModelsExhaustedException)
                        // each transient failure puts the key on cooldown
                        expect(aiPingCacheService.recordKeyCooldown).toHaveBeenCalledWith(
                            expect.objectContaining({
                                provider: ModelProvider.OpenAI,
                            }),
                        )
                    })

                it("retries on the next eligible key after one acquire returns null",
                    async () => {
                        // first acquire yields no key (treated as a failed attempt),
                        // the second acquire succeeds → result served on attempt 2
                        aiBalancerService.acquire
                            .mockRejectedValueOnce(new Error("transient"))
                            .mockResolvedValueOnce({
                                value: "sk-aaaa",
                                handle: {
                                    provider: ModelProvider.OpenAI,
                                    keySuffix: "aaaa",
                                },
                            })
                        // two eligible keys so the inner loop has a second pass
                        keyStoreService.getPool.mockReturnValue([
                            {
                                value: "sk-aaaa",
                            },
                            {
                                value: "sk-bbbb",
                            },
                        ] as never)

                        const result = await service.useApi<string>({
                            lane: AiMode.Auto,
                            action: async () => "ok",
                        })

                        expect(result.result).toBe("ok")
                        expect(aiBalancerService.acquire).toHaveBeenCalledTimes(2)
                    })

                it("throws AllModelsExhausted without acquiring when every key is unhealthy",
                    async () => {
                        // every pool key flagged unhealthy in the ping cache → zero
                        // eligible keys on every model. The sweep must terminate and
                        // throw rather than spin forever re-scanning empty pools.
                        keyStoreService.getPool.mockReturnValue([
                            {
                                value: "sk-aaaa",
                            },
                            {
                                value: "sk-bbbb",
                            },
                        ] as never)
                        aiPingCacheService.getProviderMap.mockResolvedValue({
                            "sk-aaaa": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                            },
                            "sk-bbbb": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                            },
                        })

                        await expect(
                            service.useApi<string>({
                                lane: AiMode.Auto,
                                action: async () => "ok",
                            }),
                        ).rejects.toBeInstanceOf(AllModelsExhaustedException)
                        // no eligible key was ever acquired
                        expect(aiBalancerService.acquire).not.toHaveBeenCalled()
                    })
            })

        describe("premium lane",
            () => {
                it("resolves the user-pinned model and returns its result",
                    async () => {
                        // catalog carries the pinned model; it is the one invoked
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            buildModelRow("gpt-4o"),
                        ])

                        const result = await service.useApi<string>({
                            lane: AiMode.Premium,
                            category: "balanced" as never,
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                            action: async () => "graded",
                        })

                        expect(result).toMatchObject({
                            result: "graded",
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                        })
                    })

                it("throws Unsupported when the pinned model is not in the catalog",
                    async () => {
                        // pinned (model, provider) not present → unsupported
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            buildModelRow("gpt-4o"),
                        ])

                        await expect(
                            service.useApi<string>({
                                lane: AiMode.Premium,
                                category: "balanced" as never,
                                model: "ghost-model",
                                provider: ModelProvider.OpenAI,
                                action: async () => "x",
                            }),
                        ).rejects.toBeInstanceOf(UnsupportedAiProviderException)
                    })

                it("falls back to the highest-priority model when none is pinned",
                    async () => {
                        // no pin → take catalog[0] (already priority-ordered)
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            buildModelRow("gpt-4o"),
                            buildModelRow("gpt-4o-mini"),
                        ])

                        const result = await service.useApi<string>({
                            lane: AiMode.Premium,
                            category: "balanced" as never,
                            action: async () => "ok",
                        })

                        expect(result.model).toBe("gpt-4o")
                    })

                it("throws NoActiveBalancerKey when no eligible key remains",
                    async () => {
                        // the resolved model's key is unhealthy → no eligible key
                        aiPingCacheService.getProviderMap.mockResolvedValue({
                            "sk-aaaa": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                            },
                        })

                        await expect(
                            service.useApi<string>({
                                lane: AiMode.Premium,
                                category: "balanced" as never,
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                                action: async () => "ok",
                            }),
                        ).rejects.toBeInstanceOf(NoActiveBalancerKeyException)
                    })

                it("throws AllModelsExhausted when the catalog is empty",
                    async () => {
                        // no models + no pin → nothing to resolve
                        aiModelCatalogService.enabledModels.mockResolvedValue([])

                        await expect(
                            service.useApi<string>({
                                lane: AiMode.Premium,
                                category: "balanced" as never,
                                action: async () => "ok",
                            }),
                        ).rejects.toBeInstanceOf(AllModelsExhaustedException)
                    })
            })

        describe("byok lane",
            () => {
                it("invokes once with the user's key and bypasses the pool",
                    async () => {
                        // BYOK never touches the balancer / catalog / cache
                        const result = await service.useApi<string>({
                            lane: AiMode.Byok,
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o-mini",
                            key: "sk-user",
                            action: async () => "byok-result",
                        })

                        expect(result).toEqual({
                            result: "byok-result",
                            model: "gpt-4o-mini",
                            provider: ModelProvider.OpenAI,
                            attempts: 1,
                        })
                        expect(aiBalancerService.acquire).not.toHaveBeenCalled()
                        expect(aiPingCacheService.recordKeySuccess).not.toHaveBeenCalled()
                        expect(aiPingCacheService.recordKeyCooldown).not.toHaveBeenCalled()
                    })

                it("propagates the action error without a pooled cache update",
                    async () => {
                        // BYOK failures surface raw — no rotation, no cache write
                        await expect(
                            service.useApi<string>({
                                lane: AiMode.Byok,
                                provider: ModelProvider.OpenAI,
                                model: "gpt-4o-mini",
                                key: "sk-user",
                                action: async () => {
                                    throw new Error("byok boom")
                                },
                            }),
                        ).rejects.toThrow("byok boom")
                    })
            })
    })
