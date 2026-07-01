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
    AiModelCategory,
    AiModelEntity,
    AiModelTask,
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
        let aiModelLatencyCacheService: { getAll: jest.Mock }

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
                        useValue: aiModelLatencyCacheService = {
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

        describe("probeModel",
            () => {
                let fetchSpy: jest.SpyInstance
                // stub the private key acquisition so a key is always handed back
                const stubAcquire = (value: string | null = "sk-aaaa") => {
                    jest.spyOn(
                        service as unknown as {
                            tryAcquire: (p: ModelProvider) => Promise<unknown>
                        },
                        "tryAcquire",
                    ).mockResolvedValue(
                        value === null
                            ? null
                            : {
                                value,
                                handle: {
                                    provider: ModelProvider.OpenAI,
                                    keySuffix: "aaaa",
                                },
                            },
                    )
                }

                /** Fake a `fetch` Response with the given status + optional json body. */
                const fakeResponse = (
                    status: number,
                    body?: unknown,
                ): Response => ({
                    ok: status >= 200 && status < 300,
                    status,
                    statusText: `status ${status}`,
                    json: jest.fn(async () => {
                        if (body === undefined) {
                            throw new Error("no body")
                        }
                        return body
                    }),
                }) as unknown as Response

                afterEach(() => {
                    fetchSpy?.mockRestore()
                })

                it("returns ok on a 2xx — even with an empty body",
                    async () => {
                        stubAcquire()
                        fetchSpy = jest
                            .spyOn(global, "fetch")
                            .mockResolvedValue(fakeResponse(200))

                        const result = await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 5_000,
                        })

                        expect(result.ok).toBe(true)
                        expect(result.errorMessage).toBeNull()
                    })

                it.each([
                    401,
                    404,
                    429,
                    500,
                ])(
                    "returns down with a [%s]-prefixed message on a non-2xx",
                    async (status) => {
                        stubAcquire()
                        fetchSpy = jest
                            .spyOn(global, "fetch")
                            .mockResolvedValue(
                                fakeResponse(status, {
                                    error: {
                                        message: "boom detail",
                                    },
                                }),
                            )

                        const result = await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 5_000,
                        })

                        expect(result.ok).toBe(false)
                        expect(result.errorMessage).toMatch(
                            new RegExp(`^\\[${status}\\]`),
                        )
                        expect(result.errorMessage).toContain("boom detail")
                    },
                )

                it.each([
                    "TimeoutError",
                    "AbortError",
                ])(
                    "returns a timeout reason when fetch aborts (%s)",
                    async (errorName) => {
                        stubAcquire()
                        const abortErr = new Error("aborted")
                        abortErr.name = errorName
                        fetchSpy = jest
                            .spyOn(global, "fetch")
                            .mockRejectedValue(abortErr)

                        const result = await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 3_000,
                        })

                        expect(result.ok).toBe(false)
                        expect(result.errorMessage).toContain("timeout")
                    },
                )

                it("returns down when no eligible key can be acquired",
                    async () => {
                        stubAcquire(null)
                        fetchSpy = jest.spyOn(global, "fetch")

                        const result = await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 5_000,
                        })

                        expect(result.ok).toBe(false)
                        expect(result.errorMessage).toBe("No eligible key for provider")
                        // never reached the network with no key
                        expect(fetchSpy).not.toHaveBeenCalled()
                    })

                it("builds the OpenAI request with max_completion_tokens",
                    async () => {
                        stubAcquire()
                        fetchSpy = jest
                            .spyOn(global, "fetch")
                            .mockResolvedValue(fakeResponse(200))

                        await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 5_000,
                        })

                        const [url, init] = fetchSpy.mock.calls[0]
                        expect(url).toBe("https://api.openai.com/v1/chat/completions")
                        const body = JSON.parse((init as RequestInit).body as string)
                        // 16 (not 1) — reasoning-family models need headroom past hidden
                        // reasoning before a visible token, else OpenAI 400s instead of a
                        // clean empty 2xx completion
                        expect(body.max_completion_tokens).toBe(16)
                        expect(body.max_tokens).toBeUndefined()
                        expect(body.model).toBe("gpt-4o")
                    })

                it("builds the Local request with max_tokens",
                    async () => {
                        stubAcquire()
                        fetchSpy = jest
                            .spyOn(global, "fetch")
                            .mockResolvedValue(fakeResponse(200))

                        await service.probeModel({
                            provider: ModelProvider.Local,
                            model: "qwen2.5-coder:7b",
                            timeoutMs: 5_000,
                        })

                        const [url, init] = fetchSpy.mock.calls[0]
                        expect(url).toContain("/chat/completions")
                        const body = JSON.parse((init as RequestInit).body as string)
                        expect(body.max_tokens).toBe(1)
                        expect(body.max_completion_tokens).toBeUndefined()
                    })

                it("builds the Gemini request with :generateContent?key=",
                    async () => {
                        stubAcquire("gemini-key")
                        fetchSpy = jest
                            .spyOn(global, "fetch")
                            .mockResolvedValue(fakeResponse(200))

                        await service.probeModel({
                            provider: ModelProvider.Gemini,
                            model: "gemini-2.5-pro",
                            timeoutMs: 5_000,
                        })

                        const [url] = fetchSpy.mock.calls[0]
                        expect(url).toContain("gemini-2.5-pro:generateContent?key=gemini-key")
                    })

                it("builds the Anthropic request with x-api-key + anthropic-version",
                    async () => {
                        stubAcquire("anthropic-key")
                        fetchSpy = jest
                            .spyOn(global, "fetch")
                            .mockResolvedValue(fakeResponse(200))

                        await service.probeModel({
                            provider: ModelProvider.Anthropic,
                            model: "claude-opus-4-8",
                            timeoutMs: 5_000,
                        })

                        const [url, init] = fetchSpy.mock.calls[0]
                        expect(url).toBe("https://api.anthropic.com/v1/messages")
                        const headers = (init as RequestInit).headers as Record<string, string>
                        expect(headers["x-api-key"]).toBe("anthropic-key")
                        expect(headers["anthropic-version"]).toBe("2023-06-01")
                    })
            })

        describe("orderByHealthAndLatency freeLocalRank",
            () => {
                // call the private reorderer directly with a model list + a mocked
                // latency snapshot, then read the resulting order.
                const reorder = (
                    models: Array<AiModelEntity>,
                    categories?: Array<AiModelCategory>,
                    task?: AiModelTask,
                ): Promise<Array<AiModelEntity>> =>
                    (service as unknown as {
                        orderByHealthAndLatency: (
                            m: Array<AiModelEntity>,
                            c: Array<AiModelCategory> | undefined,
                            t: AiModelTask | undefined,
                        ) => Promise<Array<AiModelEntity>>
                    }).orderByHealthAndLatency(models, categories, task)

                /** Build a catalog row with category + provider + weight. */
                const row = (
                    name: string,
                    category: AiModelCategory,
                    provider: ModelProvider,
                    weight = 0,
                ): AiModelEntity => ({
                    name,
                    category,
                    provider,
                    weight,
                } as AiModelEntity)

                /** Fresh latency-cache snapshot keyed by model name. */
                const snapshot = (
                    entries: Record<string, { ok: boolean, latencyMs?: number }>,
                ) => {
                    const map: Record<string, unknown> = {
                    }
                    for (const [name, { ok, latencyMs }] of Object.entries(entries)) {
                        map[name] = {
                            provider: ModelProvider.Local,
                            ok,
                            latencyMs: latencyMs ?? 0,
                            checkedAt: new Date().toISOString(),
                            errorMessage: ok ? null : "down",
                        }
                    }
                    return map
                }

                it("sorts a healthy Free Local model FIRST within the Free tier",
                    async () => {
                        const freeLocal = row("qwen-local", AiModelCategory.Free, ModelProvider.Local)
                        const freeCloudA = row("free-a", AiModelCategory.Free, ModelProvider.OpenAI)
                        const freeCloudB = row("free-b", AiModelCategory.Free, ModelProvider.Gemini)
                        const economy = row("eco-1", AiModelCategory.Economy, ModelProvider.OpenAI)
                        // local probed healthy
                        aiModelLatencyCacheService.getAll.mockResolvedValue(
                            snapshot({
                                "qwen-local": {
                                    ok: true,
                                    latencyMs: 50,
                                },
                            }),
                        )

                        const ordered = await reorder(
                            [
                                freeCloudA,
                                freeCloudB,
                                freeLocal,
                                economy,
                            ],
                            [
                                AiModelCategory.Free,
                                AiModelCategory.Economy,
                            ],
                        )

                        // local first in Free tier; economy stays last
                        expect(ordered[0].name).toBe("qwen-local")
                        expect(ordered[ordered.length - 1].name).toBe("eco-1")
                    })

                it("pushes a probe-down Free Local model AFTER healthy cloud (downRank wins)",
                    async () => {
                        const freeLocal = row("qwen-local", AiModelCategory.Free, ModelProvider.Local)
                        const freeCloudA = row("free-a", AiModelCategory.Free, ModelProvider.OpenAI)
                        // local probed DOWN
                        aiModelLatencyCacheService.getAll.mockResolvedValue(
                            snapshot({
                                "qwen-local": {
                                    ok: false,
                                },
                            }),
                        )

                        const ordered = await reorder(
                            [
                                freeLocal,
                                freeCloudA,
                            ],
                            [
                                AiModelCategory.Free,
                            ],
                        )

                        // down local loses to the healthy/unprobed cloud model
                        expect(ordered[0].name).toBe("free-a")
                        expect(ordered[1].name).toBe("qwen-local")
                    })

                it("leaves Economy/paid order untouched across tiers",
                    async () => {
                        const freeLocal = row("qwen-local", AiModelCategory.Free, ModelProvider.Local)
                        const ecoHi = row("eco-hi", AiModelCategory.Economy, ModelProvider.OpenAI, 10)
                        const ecoLo = row("eco-lo", AiModelCategory.Economy, ModelProvider.OpenAI, 1)
                        aiModelLatencyCacheService.getAll.mockResolvedValue(
                            snapshot({
                                "qwen-local": {
                                    ok: true,
                                },
                            }),
                        )

                        const ordered = await reorder(
                            [
                                freeLocal,
                                ecoHi,
                                ecoLo,
                            ],
                            [
                                AiModelCategory.Free,
                                AiModelCategory.Economy,
                            ],
                        )

                        // Free tier (local) stays ahead of Economy; within Economy the
                        // original (weight) order is preserved — paid tiers untouched.
                        expect(ordered.map((m) => m.name)).toEqual([
                            "qwen-local",
                            "eco-hi",
                            "eco-lo",
                        ])
                    })
            })
    })
