import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelLatencyCacheService,
} from "@modules/integrations/cache/ai-model-latency-cache.service"
import {
    AiPingCacheService,
} from "@modules/integrations/cache/ai-ping-cache.service"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    AllModelsExhaustedException,
} from "@modules/platform/exceptions/errors/ai/all-models-exhausted"
import {
    NoActiveBalancerKeyException,
} from "@modules/platform/exceptions/errors/ai/no-active-balancer-key"
import {
    UnsupportedAiProviderException,
} from "@modules/platform/exceptions/errors/ai/unsupported-ai-provider"
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
} from "@modules/platform/winston/winston.service"

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
        let keyStoreService: jest.Mocked<
            Pick<KeyStoreService, "ensureLoaded" | "getPool" | "listProviders">
        >
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

            // ping cache: empty map -> every key eligible; record is a no-op spy
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
                listProviders: jest.fn(() => []),
            } as unknown as jest.Mocked<
                Pick<KeyStoreService, "ensureLoaded" | "getPool" | "listProviders">
            >

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
                            getAll: jest.fn().mockResolvedValue({
                            }),
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
                            lane: "chain",
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
                            lane: "chain",
                            action: async () => "ok",
                        })

                        expect(keyStoreService.ensureLoaded).toHaveBeenCalledTimes(1)
                    })

                it("throws AllModelsExhausted after every attempt fails",
                    async () => {
                        // the action always throws -> retry until max attempts -> exhausted
                        // (a raw, unclassified provider-call failure -- the SUT is what
                        // classifies it, that's the behavior under test)
                        const providerError = new Error("boom")
                        await expect(
                            service.useApi<string>({
                                lane: "chain",
                                action: async () => {
                                    throw providerError
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

                it("propagates key-acquisition infrastructure failures",
                    async () => {
                        const redisFailure = new Error("Redis unavailable")
                        aiBalancerService.acquire.mockRejectedValueOnce(redisFailure)

                        await expect(
                            service.useApi<string>({
                                lane: "chain",
                                action: async () => "ok",
                            }),
                        ).rejects.toBe(redisFailure)
                    })

                it("normalizes only the typed no-active-key race and retries the sweep",
                    async () => {
                        aiBalancerService.acquire
                            .mockRejectedValueOnce(
                                new NoActiveBalancerKeyException({
                                    provider: ModelProvider.OpenAI,
                                    totalKeysCount: 1,
                                }),
                            )
                            .mockResolvedValueOnce({
                                value: "sk-aaaa",
                                handle: {
                                    provider: ModelProvider.OpenAI,
                                    keySuffix: "aaaa",
                                },
                            })

                        const result = await service.useApi<string>({
                            lane: "chain",
                            action: async () => "ok",
                        })

                        expect(result).toMatchObject({
                            result: "ok",
                            attempts: 2,
                        })
                    })

                it("throws AllModelsExhausted without acquiring when every key is unhealthy",
                    async () => {
                        // every pool key flagged unhealthy in the ping cache -> zero
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
                                lane: "chain",
                                action: async () => "ok",
                            }),
                        ).rejects.toBeInstanceOf(AllModelsExhaustedException)
                        // no eligible key was ever acquired
                        expect(aiBalancerService.acquire).not.toHaveBeenCalled()
                    })

                it("surfaces a NonKey fault immediately without trying another key",
                    async () => {
                        // an aborted request is a prompt/content fault, not a bad key --
                        // another key would fail the exact same way, so the chain must
                        // stop and surface the ORIGINAL error unwrapped
                        const abortErr = new Error("the request was aborted")

                        await expect(
                            service.useApi<string>({
                                lane: "chain",
                                action: async () => {
                                    throw abortErr
                                },
                            }),
                        ).rejects.toBe(abortErr)
                        // only the single (failed) attempt was made
                        expect(aiBalancerService.acquire).toHaveBeenCalledTimes(1)
                        // a NonKey fault must NOT penalize the key
                        expect(aiPingCacheService.recordKeyCooldown).not.toHaveBeenCalled()
                    })

                it("hard-disables the key with a zero cooldown on an Auth fault",
                    async () => {
                        // an invalid/revoked key never recovers on its own -- disable it
                        // outright instead of a timed cooldown
                        const authErr = new Error("Invalid API Key provided")

                        await expect(
                            service.useApi<string>({
                                lane: "chain",
                                action: async () => {
                                    throw authErr
                                },
                            }),
                        ).rejects.toBeInstanceOf(AllModelsExhaustedException)
                        expect(aiPingCacheService.recordKeyCooldown).toHaveBeenCalledWith(
                            expect.objectContaining({
                                cooldownMs: 0,
                                disabled: true,
                            }),
                        )
                    })

                it("honors the provider's Retry-After header on a rate-limit fault",
                    async () => {
                        // provider sent a 5s delta-seconds Retry-After -- the cooldown
                        // must use that instead of the class default (60s)
                        const rateLimitErr = Object.assign(
                            new Error("Too Many Requests"),
                            {
                                status: 429,
                                headers: {
                                    "retry-after": "5",
                                },
                            },
                        )

                        await expect(
                            service.useApi<string>({
                                lane: "chain",
                                action: async () => {
                                    throw rateLimitErr
                                },
                            }),
                        ).rejects.toBeInstanceOf(AllModelsExhaustedException)
                        expect(aiPingCacheService.recordKeyCooldown).toHaveBeenCalledWith(
                            expect.objectContaining({
                                cooldownMs: 5_000,
                                disabled: false,
                            }),
                        )
                    })

                it("falls back to the 60s default cooldown on a rate-limit fault with no header",
                    async () => {
                        const rateLimitErr = Object.assign(
                            new Error("rate limit exceeded"),
                            {
                                status: 429,
                            },
                        )

                        await expect(
                            service.useApi<string>({
                                lane: "chain",
                                action: async () => {
                                    throw rateLimitErr
                                },
                            }),
                        ).rejects.toBeInstanceOf(AllModelsExhaustedException)
                        expect(aiPingCacheService.recordKeyCooldown).toHaveBeenCalledWith(
                            expect.objectContaining({
                                cooldownMs: 60_000,
                                disabled: false,
                            }),
                        )
                    })

                it("cools down with the 20s Transient default on an unrecognized error",
                    async () => {
                        // classifyAiError falls through to Transient for anything that
                        // isn't Auth/RateLimit/NonKey -- the class default is 20s, not
                        // hard-disabled and no Retry-After lookup
                        const unrecognizedError = new Error("boom")
                        await expect(
                            service.useApi<string>({
                                lane: "chain",
                                action: async () => {
                                    throw unrecognizedError
                                },
                            }),
                        ).rejects.toBeInstanceOf(AllModelsExhaustedException)
                        expect(aiPingCacheService.recordKeyCooldown).toHaveBeenCalledWith(
                            expect.objectContaining({
                                cooldownMs: 20_000,
                                disabled: false,
                            }),
                        )
                    })

                it("excludes a model whose supportedTasks does not include the requested task",
                    async () => {
                        // chat-only vs grade-only model -- requesting `chatting` must
                        // filter the grade-only row out of the fallback chain entirely
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            {
                                ...buildModelRow("chat-model"),
                                supportedTasks: [
                                    AiModelTask.Chatting,
                                ],
                            },
                            {
                                ...buildModelRow("grade-model"),
                                supportedTasks: [
                                    AiModelTask.Grading,
                                ],
                            },
                        ] as Array<AiModelEntity>)

                        const result = await service.useApi<string>({
                            lane: "chain",
                            task: AiModelTask.Chatting,
                            action: async () => "ok",
                        })

                        expect(result.model).toBe("chat-model")
                    })

                it("climbs to the next category once the lower category has no eligible key",
                    async () => {
                        // Free tier has zero keys loaded; Economy's key is healthy -- the
                        // chain must climb past the exhausted Free row without ever
                        // trying to acquire a Free-provider key
                        const freeRow = {
                            ...buildModelRow("free-model",
                                ModelProvider.OpenAI),
                            category: AiModelCategory.Low,
                            weight: 0,
                        } as AiModelEntity
                        const ecoRow = {
                            ...buildModelRow("eco-model",
                                ModelProvider.Gemini),
                            category: AiModelCategory.Low,
                            weight: 0,
                        } as AiModelEntity
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            freeRow,
                            ecoRow,
                        ])
                        keyStoreService.getPool.mockImplementation((provider) => (
                            provider === ModelProvider.Gemini
                                ? [
                                    {
                                        value: "sk-eco",
                                    },
                                ]
                                : []
                        ) as never)
                        aiBalancerService.acquire.mockResolvedValue({
                            value: "sk-eco",
                            handle: {
                                provider: ModelProvider.Gemini,
                                keySuffix: "eco",
                            },
                        })

                        const result = await service.useApi<string>({
                            lane: "chain",
                            categories: [
                                AiModelCategory.Low,
                                AiModelCategory.Low,
                            ],
                            action: async () => "ok",
                        })

                        expect(result.model).toBe("eco-model")
                        expect(result.provider).toBe(ModelProvider.Gemini)
                        // the Free row was skipped before ever acquiring a key for it
                        expect(aiBalancerService.acquire).toHaveBeenCalledWith(
                            expect.objectContaining({
                                provider: ModelProvider.Gemini,
                            }),
                        )
                    })

                it("skips catalog rows that do not match a model+provider pin inside the chain",
                    async () => {
                        // the `model`/`provider` fields on the Auto params pin the chain
                        // to one exact row -- every other row must be skipped via `continue`
                        const modelA = buildModelRow("model-a",
                            ModelProvider.OpenAI)
                        const modelB = buildModelRow("model-b",
                            ModelProvider.Gemini)
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            modelA,
                            modelB,
                        ])
                        keyStoreService.getPool.mockImplementation((provider) => (
                            provider === ModelProvider.Gemini
                                ? [
                                    {
                                        value: "sk-b",
                                    },
                                ]
                                : [
                                    {
                                        value: "sk-a",
                                    },
                                ]
                        ) as never)
                        aiBalancerService.acquire.mockResolvedValue({
                            value: "sk-b",
                            handle: {
                                provider: ModelProvider.Gemini,
                                keySuffix: "b",
                            },
                        })

                        const result = await service.useApi<string>({
                            lane: "chain",
                            model: "model-b",
                            provider: ModelProvider.Gemini,
                            action: async () => "ok",
                        })

                        expect(result.model).toBe("model-b")
                        expect(result.provider).toBe(ModelProvider.Gemini)
                        expect(aiBalancerService.acquire).toHaveBeenCalledTimes(1)
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
                            lane: "pinned",
                            category: "medium" as never,
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
                        // pinned (model, provider) not present -> unsupported
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            buildModelRow("gpt-4o"),
                        ])

                        await expect(
                            service.useApi<string>({
                                lane: "pinned",
                                category: "medium" as never,
                                model: "ghost-model",
                                provider: ModelProvider.OpenAI,
                                action: async () => "x",
                            }),
                        ).rejects.toBeInstanceOf(UnsupportedAiProviderException)
                    })

                it("falls back to the highest-priority model when none is pinned",
                    async () => {
                        // no pin -> take catalog[0] (already priority-ordered)
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            buildModelRow("gpt-4o"),
                            buildModelRow("gpt-4o-mini"),
                        ])

                        const result = await service.useApi<string>({
                            lane: "pinned",
                            category: "medium" as never,
                            action: async () => "ok",
                        })

                        expect(result.model).toBe("gpt-4o")
                    })

                it("throws NoActiveBalancerKey when no eligible key remains",
                    async () => {
                        // the resolved model's key is unhealthy -> no eligible key
                        aiPingCacheService.getProviderMap.mockResolvedValue({
                            "sk-aaaa": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                            },
                        })

                        await expect(
                            service.useApi<string>({
                                lane: "pinned",
                                category: "medium" as never,
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                                action: async () => "ok",
                            }),
                        ).rejects.toBeInstanceOf(NoActiveBalancerKeyException)
                    })

                it("throws AllModelsExhausted when the catalog is empty",
                    async () => {
                        // no models + no pin -> nothing to resolve
                        aiModelCatalogService.enabledModels.mockResolvedValue([])

                        await expect(
                            service.useApi<string>({
                                lane: "pinned",
                                category: "medium" as never,
                                action: async () => "ok",
                            }),
                        ).rejects.toBeInstanceOf(AllModelsExhaustedException)
                    })

                it("resolves a pinned model by name only when provider is omitted",
                    async () => {
                        // (model, provider) branch requires BOTH -- a name-only pin falls
                        // into the name-only `find`, still resolving the right row
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            buildModelRow("gpt-4o",
                                ModelProvider.OpenAI),
                        ])

                        const result = await service.useApi<string>({
                            lane: "pinned",
                            category: "medium" as never,
                            model: "gpt-4o",
                            action: async () => "ok",
                        })

                        expect(result.provider).toBe(ModelProvider.OpenAI)
                    })

                it("throws Unsupported when a name-only pinned model is not in the catalog",
                    async () => {
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            buildModelRow("gpt-4o",
                                ModelProvider.OpenAI),
                        ])

                        await expect(
                            service.useApi<string>({
                                lane: "pinned",
                                category: "medium" as never,
                                model: "ghost-model",
                                action: async () => "x",
                            }),
                        ).rejects.toBeInstanceOf(UnsupportedAiProviderException)
                    })

                it("surfaces a NonKey fault immediately without trying another key",
                    async () => {
                        // same short-circuit rule as the Auto lane: a prompt/content
                        // fault is not the key's fault, so stop and surface it raw
                        aiModelCatalogService.enabledModels.mockResolvedValue([
                            buildModelRow("gpt-4o"),
                        ])
                        const abortErr = new Error("the request was aborted")

                        await expect(
                            service.useApi<string>({
                                lane: "pinned",
                                category: "medium" as never,
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                                action: async () => {
                                    throw abortErr
                                },
                            }),
                        ).rejects.toBe(abortErr)
                        expect(aiBalancerService.acquire).toHaveBeenCalledTimes(1)
                        expect(aiPingCacheService.recordKeyCooldown).not.toHaveBeenCalled()
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
                            // mirrors a real `Response.json()` parse failure on an empty body
                            const noBodyError = new Error("no body")
                            throw noBodyError
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
                            .spyOn(global,
                                "fetch")
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
                            .spyOn(global,
                                "fetch")
                            .mockResolvedValue(
                                fakeResponse(status,
                                    {
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

                it("reads a string-shaped `error` field on a non-2xx",
                    async () => {
                        stubAcquire()
                        fetchSpy = jest
                            .spyOn(global,
                                "fetch")
                            .mockResolvedValue(
                                fakeResponse(400,
                                    {
                                        error: "plain string reason",
                                    }),
                            )

                        const result = await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 5_000,
                        })

                        expect(result.errorMessage).toBe("[400] plain string reason")
                    })

                it("falls back to a top-level `message` field when `error` is absent",
                    async () => {
                        stubAcquire()
                        fetchSpy = jest
                            .spyOn(global,
                                "fetch")
                            .mockResolvedValue(
                                fakeResponse(400,
                                    {
                                        message: "top-level message",
                                    }),
                            )

                        const result = await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 5_000,
                        })

                        expect(result.errorMessage).toBe("[400] top-level message")
                    })

                it("falls back to the HTTP status text when the body is not JSON",
                    async () => {
                        stubAcquire()
                        fetchSpy = jest
                            .spyOn(global,
                                "fetch")
                            // no `body` arg -> `.json()` rejects, exercising the catch path
                            .mockResolvedValue(fakeResponse(500))

                        const result = await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 5_000,
                        })

                        expect(result.errorMessage).toBe("[500] status 500")
                    })

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
                            .spyOn(global,
                                "fetch")
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
                        fetchSpy = jest.spyOn(global,
                            "fetch")

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

                it("normalizes a non-Error network failure from a probe",
                    async () => {
                        stubAcquire()
                        fetchSpy = jest.spyOn(global,
                            "fetch").mockRejectedValue("socket reset")

                        const result = await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 5_000,
                        })

                        expect(result).toMatchObject({
                            ok: false,
                            errorMessage: "socket reset",
                        })
                    })

                it("builds the OpenAI request with max_completion_tokens",
                    async () => {
                        stubAcquire()
                        fetchSpy = jest
                            .spyOn(global,
                                "fetch")
                            .mockResolvedValue(fakeResponse(200))

                        await service.probeModel({
                            provider: ModelProvider.OpenAI,
                            model: "gpt-4o",
                            timeoutMs: 5_000,
                        })

                        const [url,
                            init] = fetchSpy.mock.calls[0]
                        expect(url).toBe("https://api.openai.com/v1/chat/completions")
                        const body = JSON.parse((init as RequestInit).body as string)
                        // 16 (not 1) -- reasoning-family models need headroom past hidden
                        // reasoning before a visible token, else OpenAI 400s instead of a
                        // clean empty 2xx completion
                        expect(body.max_completion_tokens).toBe(16)
                        expect(body.max_tokens).toBeUndefined()
                        expect(body.model).toBe("gpt-4o")
                    })

                it("builds the OpenRouter request with max_completion_tokens",
                    async () => {
                        stubAcquire("openrouter-key")
                        fetchSpy = jest
                            .spyOn(global,
                                "fetch")
                            .mockResolvedValue(fakeResponse(200))

                        await service.probeModel({
                            provider: ModelProvider.OpenRouter,
                            model: "qwen/qwen-2.5-coder-32b-instruct",
                            timeoutMs: 5_000,
                        })

                        const [url,
                            init] = fetchSpy.mock.calls[0]
                        expect(url).toContain("/chat/completions")
                        const headers = (init as RequestInit).headers as Record<string, string>
                        expect(headers.Authorization).toBe("Bearer openrouter-key")
                        const body = JSON.parse((init as RequestInit).body as string)
                        // reasoning-family OpenRouter routes reject `max_tokens` the same
                        // way native OpenAI does -- same 16-token reasoning-headroom floor
                        expect(body.max_completion_tokens).toBe(16)
                        expect(body.max_tokens).toBeUndefined()
                    })

                it("builds the Local request with max_tokens",
                    async () => {
                        stubAcquire()
                        fetchSpy = jest
                            .spyOn(global,
                                "fetch")
                            .mockResolvedValue(fakeResponse(200))

                        await service.probeModel({
                            provider: ModelProvider.Local,
                            model: "qwen2.5-coder:7b",
                            timeoutMs: 5_000,
                        })

                        const [url,
                            init] = fetchSpy.mock.calls[0]
                        expect(url).toContain("/chat/completions")
                        const body = JSON.parse((init as RequestInit).body as string)
                        expect(body.max_tokens).toBe(1)
                        expect(body.max_completion_tokens).toBeUndefined()
                    })

                it("builds the Gemini request with :generateContent?key=",
                    async () => {
                        stubAcquire("gemini-key")
                        fetchSpy = jest
                            .spyOn(global,
                                "fetch")
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
                            .spyOn(global,
                                "fetch")
                            .mockResolvedValue(fakeResponse(200))

                        await service.probeModel({
                            provider: ModelProvider.Anthropic,
                            model: "claude-opus-4-8",
                            timeoutMs: 5_000,
                        })

                        const [url,
                            init] = fetchSpy.mock.calls[0]
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
                    }).orderByHealthAndLatency(models,
                        categories,
                        task)

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
                    for (const [name,
                        { ok, latencyMs }] of Object.entries(entries)) {
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
                        const freeLocal = row("qwen-local",
                            AiModelCategory.Low,
                            ModelProvider.Local)
                        const freeCloudA = row("free-a",
                            AiModelCategory.Low,
                            ModelProvider.OpenAI)
                        const freeCloudB = row("free-b",
                            AiModelCategory.Low,
                            ModelProvider.Gemini)
                        const economy = row("eco-1",
                            AiModelCategory.Low,
                            ModelProvider.OpenAI)
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
                                AiModelCategory.Low,
                                AiModelCategory.Low,
                            ],
                        )

                        // local first in Free tier; economy stays last
                        expect(ordered[0].name).toBe("qwen-local")
                        expect(ordered[ordered.length - 1].name).toBe("eco-1")
                    })

                it("pushes a probe-down Free Local model AFTER healthy cloud (downRank wins)",
                    async () => {
                        const freeLocal = row("qwen-local",
                            AiModelCategory.Low,
                            ModelProvider.Local)
                        const freeCloudA = row("free-a",
                            AiModelCategory.Low,
                            ModelProvider.OpenAI)
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
                                AiModelCategory.Low,
                            ],
                        )

                        // down local loses to the healthy/unprobed cloud model
                        expect(ordered[0].name).toBe("free-a")
                        expect(ordered[1].name).toBe("qwen-local")
                    })

                it("leaves Economy/paid order untouched across tiers",
                    async () => {
                        const freeLocal = row("qwen-local",
                            AiModelCategory.Low,
                            ModelProvider.Local)
                        const ecoHi = row("eco-hi",
                            AiModelCategory.Low,
                            ModelProvider.OpenAI,
                            10)
                        const ecoLo = row("eco-lo",
                            AiModelCategory.Low,
                            ModelProvider.OpenAI,
                            1)
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
                                AiModelCategory.Low,
                                AiModelCategory.Low,
                            ],
                        )

                        // Free tier (local) stays ahead of Economy; within Economy the
                        // original (weight) order is preserved -- paid tiers untouched.
                        expect(ordered.map((m) => m.name)).toEqual([
                            "qwen-local",
                            "eco-hi",
                            "eco-lo",
                        ])
                    })

                it("orders chatting models by fresh latency and preserves ties by catalog order",
                    async () => {
                        const slow = row("slow",
                            AiModelCategory.Low,
                            ModelProvider.OpenAI)
                        const fast = row("fast",
                            AiModelCategory.Low,
                            ModelProvider.OpenAI)
                        const tie = row("tie",
                            AiModelCategory.Low,
                            ModelProvider.OpenAI)
                        aiModelLatencyCacheService.getAll.mockResolvedValue(snapshot({
                            slow: {
                                ok: true, latencyMs: 200
                            },
                            fast: {
                                ok: true, latencyMs: 20
                            },
                            tie: {
                                ok: true, latencyMs: 20
                            },
                        }))

                        const ordered = await reorder(
                            [slow,
                                fast,
                                tie],
                            [AiModelCategory.Low],
                            AiModelTask.Chatting,
                        )

                        expect(ordered.map((model) => model.name)).toEqual([
                            "fast",
                            "tie",
                            "slow",
                        ])
                    })
            })

        describe("availableProviders",
            () => {
                it("includes only providers with at least one eligible key",
                    async () => {
                        // two loaded providers; OpenAI's key is healthy, Gemini's is
                        // still cooling down -> only OpenAI should come back usable
                        keyStoreService.listProviders.mockReturnValue([
                            {
                                provider: ModelProvider.OpenAI,
                                keysFilePath: "openai.key",
                            },
                            {
                                provider: ModelProvider.Gemini,
                                keysFilePath: "gemini.key",
                            },
                        ])
                        keyStoreService.getPool.mockImplementation((provider) => (
                            provider === ModelProvider.OpenAI
                                ? [
                                    {
                                        value: "sk-openai",
                                    },
                                ]
                                : [
                                    {
                                        value: "sk-gemini",
                                    },
                                ]
                        ) as never)
                        aiPingCacheService.getProviderMap.mockImplementation(async (provider) => (
                            provider === ModelProvider.Gemini
                                ? {
                                    "sk-gemini": {
                                        status: false,
                                        lastPing: new Date().toISOString(),
                                        cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                                    },
                                }
                                : {
                                }
                        ) as never)

                        const usable = await service.availableProviders()

                        expect(usable.has(ModelProvider.OpenAI)).toBe(true)
                        expect(usable.has(ModelProvider.Gemini)).toBe(false)
                    })

                it("loads keys before checking eligibility",
                    async () => {
                        keyStoreService.listProviders.mockReturnValue([])

                        await service.availableProviders()

                        expect(keyStoreService.ensureLoaded).toHaveBeenCalledTimes(1)
                    })

                it("returns an empty set when no provider is loaded",
                    async () => {
                        keyStoreService.listProviders.mockReturnValue([])

                        const usable = await service.availableProviders()

                        expect(usable.size).toBe(0)
                    })

                it("excludes a configured provider whose key pool is empty",
                    async () => {
                        keyStoreService.listProviders.mockReturnValue([
                            {
                                provider: ModelProvider.OpenAI,
                                keysFilePath: "openai.key",
                            },
                        ])
                        keyStoreService.getPool.mockReturnValue([])

                        const usable = await service.availableProviders()

                        expect(usable).not.toContain(ModelProvider.OpenAI)
                        expect(aiPingCacheService.getProviderMap).toHaveBeenCalledWith(
                            ModelProvider.OpenAI,
                        )
                    })

                it("rejects an unsupported provider while building an action context",
                    () => {
                        const buildContext = (service as unknown as {
                            buildContext: (provider: ModelProvider | string, key: string, model: string) => unknown
                        }).buildContext.bind(service)

                        for (const provider of Object.values(ModelProvider)) {
                            expect(buildContext(provider,
                                "key",
                                "model")).toEqual(expect.objectContaining({
                                provider,
                                model: "model",
                            }))
                        }

                        expect(() => buildContext("unsupported",
                            "key",
                            "model"))
                            .toThrow(UnsupportedAiProviderException)
                    })
            })

        it("filters and orders an entitled task chain while preserving stale models",
            async () => {
                const first = Object.assign(buildModelRow("first"),
                    {
                        category: AiModelCategory.Medium,
                        weight: 1,
                        supportedTasks: [AiModelTask.Chatting],
                    })
                const second = Object.assign(buildModelRow("second"),
                    {
                        category: AiModelCategory.Low,
                        weight: 5,
                        supportedTasks: [AiModelTask.Grading],
                    })
                const stale = Object.assign(buildModelRow("stale"),
                    {
                        category: AiModelCategory.Low,
                        weight: 1,
                    })
                aiModelCatalogService.enabledModels.mockResolvedValue([first,
                    second,
                    stale])
                const resolveChain = (service as unknown as {
                    resolveAutoModelChain: (params: { categories: AiModelCategory[]; task: AiModelTask }) => Promise<AiModelEntity[]>
                }).resolveAutoModelChain.bind(service)
                await expect(resolveChain({
                    categories: [AiModelCategory.Low,
                        AiModelCategory.Medium],
                    task: AiModelTask.Chatting,
                })).resolves.toEqual([stale,
                    first])
            })

        it("normalizes no-active acquisitions and preserves infrastructure failures",
            async () => {
                const tryAcquire = (service as unknown as {
                    tryAcquire: (provider: ModelProvider) => Promise<unknown>
                }).tryAcquire.bind(service)
                aiBalancerService.acquire.mockRejectedValueOnce(new NoActiveBalancerKeyException({
                    provider: ModelProvider.OpenAI,
                    totalKeysCount: 1,
                }))
                await expect(tryAcquire(ModelProvider.OpenAI)).resolves.toBeNull()
                const failure = new Error("redis down")
                aiBalancerService.acquire.mockRejectedValueOnce(failure)
                await expect(tryAcquire(ModelProvider.OpenAI)).rejects.toBe(failure)
            })

        it("reads provider probe error formats and falls back to status text",
            async () => {
                const readProbeError = (service as unknown as {
                    readProbeError: (response: Response) => Promise<string>
                }).readProbeError.bind(service)
                await expect(readProbeError(new Response(JSON.stringify({
                    error: "quota"
                }),
                {
                    status: 429, statusText: "Too Many",
                }))).resolves.toBe("quota")
                await expect(readProbeError(new Response(JSON.stringify({
                    error: {
                        message: "invalid"
                    }
                }),
                {
                    status: 400, statusText: "Bad Request",
                }))).resolves.toBe("invalid")
                await expect(readProbeError(new Response(JSON.stringify({
                }),
                {
                    status: 503, statusText: "Unavailable",
                }))).resolves.toBe("Unavailable")
                await expect(readProbeError(new Response("not-json",
                    {
                        status: 500, statusText: "Server Error",
                    }))).resolves.toBe("Server Error")
            })
    })
