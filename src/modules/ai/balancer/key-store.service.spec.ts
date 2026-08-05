import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    KeyStoreService,
} from "./key-store.service"
import {
    AiModelCatalogService,
} from "./ai-model-catalog.service"
import {
    KeyStatus,
} from "./enums/key-status"

/**
 * Build an enabled catalog row carrying the (provider, keysFilePath) pair the
 * store dedupes and loads pools for.
 */
const buildModelRow = (
    overrides: Partial<AiModelEntity> = {
    },
): AiModelEntity => ({
    provider: ModelProvider.OpenAI,
    keysFilePath: "/mnt/openai.keys",
    ...overrides,
}) as AiModelEntity

describe("KeyStoreService",
    () => {
        let module: TestingModule
        let service: KeyStoreService
        let mountFilesystemService: jest.Mocked<
            Pick<
                MountFilesystemService,
                | "openAiApiKeys"
                | "geminiApiKeys"
                | "localApiKeys"
                | "openRouterApiKeys"
                | "anthropicApiKeys"
                | "readKeysFile"
            >
        >
        let aiModelCatalogService: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>
        let winstonService: jest.Mocked<Pick<WinstonService, "log">>

        beforeEach(async () => {
            // mount file readers: OpenAI returns two keys, others empty
            mountFilesystemService = {
                openAiApiKeys: jest.fn(() => [
                    "sk-openai-aaaa",
                    "sk-openai-bbbb",
                ]),
                geminiApiKeys: jest.fn(() => []),
                localApiKeys: jest.fn(() => []),
                openRouterApiKeys: jest.fn(() => []),
                anthropicApiKeys: jest.fn(() => []),
                // catalog key files resolve to nothing in the test -> the store
                // falls back to the legacy per-provider pool getters above
                readKeysFile: jest.fn(() => []),
            } as unknown as jest.Mocked<
                Pick<
                    MountFilesystemService,
                    | "openAiApiKeys"
                    | "geminiApiKeys"
                    | "localApiKeys"
                    | "openRouterApiKeys"
                    | "anthropicApiKeys"
                    | "readKeysFile"
                >
            >

            // catalog: a single OpenAI model row by default
            aiModelCatalogService = {
                enabledModels: jest.fn(async () => [
                    buildModelRow(),
                ]),
            } as unknown as jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

            winstonService = {
                log: jest.fn(),
            } as unknown as jest.Mocked<Pick<WinstonService, "log">>

            module = await Test.createTestingModule({
                providers: [
                    KeyStoreService,
                    {
                        provide: MountFilesystemService,
                        useValue: mountFilesystemService,
                    },
                    {
                        provide: AiModelCatalogService,
                        useValue: aiModelCatalogService,
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonService,
                    },
                ],
            }).compile()

            service = module.get<KeyStoreService>(KeyStoreService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("ensureLoaded",
            () => {
                it("loads pools once and hydrates fresh KeyState entries",
                    async () => {
                        await service.ensureLoaded()

                        const pool = service.getPool(ModelProvider.OpenAI)
                        expect(pool).toHaveLength(2)
                        // each entry starts Active with a 4-char suffix and zero failures
                        expect(pool[0]).toMatchObject({
                            value: "sk-openai-aaaa",
                            provider: ModelProvider.OpenAI,
                            status: KeyStatus.Active,
                            keySuffix: "aaaa",
                            failCount: 0,
                        })
                    })

                it("is a no-op after the first successful load",
                    async () => {
                        await service.ensureLoaded()
                        // second call must NOT re-query the catalog
                        await service.ensureLoaded()

                        expect(aiModelCatalogService.enabledModels).toHaveBeenCalledTimes(1)
                    })
            })

        describe("reloadAll",
            () => {
                it("de-duplicates rows sharing one (provider, keysFilePath) pair",
                    async () => {
                        // three rows but only one unique provider/file -> one read
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow(),
                            buildModelRow(),
                            buildModelRow(),
                        ])

                        await service.reloadAll()

                        // the OpenAI key file was parsed exactly once despite 3 rows
                        expect(mountFilesystemService.openAiApiKeys).toHaveBeenCalledTimes(1)
                    })

                it("can be called again to refresh an already-loaded pool",
                    async () => {
                        await service.ensureLoaded()
                        // force a fresh read with a different key set
                        mountFilesystemService.openAiApiKeys.mockReturnValueOnce([
                            "sk-openai-cccc",
                        ])

                        await service.reloadAll()

                        const pool = service.getPool(ModelProvider.OpenAI)
                        expect(pool).toHaveLength(1)
                        expect(pool[0].keySuffix).toBe("cccc")
                    })

                it("merges + de-duplicates keys across every catalog file declared for a provider",
                    async () => {
                        // two models, same provider, two DIFFERENT key files
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                keysFilePath: "/mnt/openai-a.keys",
                            }),
                            buildModelRow({
                                keysFilePath: "/mnt/openai-b.keys",
                            }),
                        ])
                        // file B repeats one key already read from file A
                        mountFilesystemService.readKeysFile.mockImplementation((path: string) => {
                            if (path === "/mnt/openai-a.keys") {
                                return [
                                    "sk-a-1111",
                                    "sk-shared-9999",
                                ]
                            }
                            if (path === "/mnt/openai-b.keys") {
                                return [
                                    "sk-shared-9999",
                                    "sk-b-2222",
                                ]
                            }
                            return []
                        })

                        await service.reloadAll()

                        const pool = service.getPool(ModelProvider.OpenAI)
                        // the shared key survives once, kept tagged with the FIRST file it appeared in
                        expect(pool.map((key) => key.value)).toEqual([
                            "sk-a-1111",
                            "sk-shared-9999",
                            "sk-b-2222",
                        ])
                        expect(pool.find((key) => key.value === "sk-shared-9999")?.keysFilePath)
                            .toBe("/mnt/openai-a.keys")
                        // catalog files resolved real keys -> the legacy getter must be skipped
                        expect(mountFilesystemService.openAiApiKeys).not.toHaveBeenCalled()
                        expect(service.listProviders()).toEqual([
                            {
                                provider: ModelProvider.OpenAI,
                                keysFilePath: "/mnt/openai-a.keys, /mnt/openai-b.keys",
                            },
                        ])
                    })

                it("falls back to the '(legacy)' path label when no model declares a keysFilePath",
                    async () => {
                        // keysFilePath omitted -> the provider's path Set stays empty
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                keysFilePath: "",
                            }),
                        ])

                        await service.reloadAll()

                        // legacy getter was consulted since no catalog file could be read
                        expect(mountFilesystemService.openAiApiKeys).toHaveBeenCalledTimes(1)
                        expect(service.listProviders()).toEqual([
                            {
                                provider: ModelProvider.OpenAI,
                                keysFilePath: "(legacy)",
                            },
                        ])
                    })
            })

        describe("getPool",
            () => {
                it("returns an empty array for an unknown / unloaded provider",
                    async () => {
                        // Gemini was never loaded -> empty pool, no crash
                        expect(service.getPool(ModelProvider.Gemini)).toEqual([])
                    })
            })

        describe("listProviders",
            () => {
                it("reports each loaded provider with its mount path",
                    async () => {
                        await service.ensureLoaded()

                        expect(service.listProviders()).toEqual([
                            {
                                provider: ModelProvider.OpenAI,
                                keysFilePath: "/mnt/openai.keys",
                            },
                        ])
                    })

                it("reports every loaded provider when the catalog spans several",
                    async () => {
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow(),
                            buildModelRow({
                                provider: ModelProvider.Gemini,
                                keysFilePath: "/mnt/gemini.keys",
                            }),
                        ])

                        await service.ensureLoaded()

                        expect(service.listProviders()).toEqual(
                            expect.arrayContaining([
                                {
                                    provider: ModelProvider.OpenAI,
                                    keysFilePath: "/mnt/openai.keys",
                                },
                                {
                                    provider: ModelProvider.Gemini,
                                    keysFilePath: "/mnt/gemini.keys",
                                },
                            ]),
                        )
                    })
            })

        describe("legacy per-provider fallback (reloadProvider → readLegacyKeys)",
            () => {
                it("reads the Local provider's bearer-token pool",
                    async () => {
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                provider: ModelProvider.Local,
                                keysFilePath: "",
                            }),
                        ])
                        mountFilesystemService.localApiKeys.mockReturnValueOnce([
                            "local-bearer-token",
                        ])

                        await service.reloadAll()

                        expect(service.getPool(ModelProvider.Local).map((key) => key.value))
                            .toEqual([
                                "local-bearer-token",
                            ])
                    })

                it("reads the OpenRouter provider's pooled keys",
                    async () => {
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                provider: ModelProvider.OpenRouter,
                                keysFilePath: "",
                            }),
                        ])
                        mountFilesystemService.openRouterApiKeys.mockReturnValueOnce([
                            "sk-or-1111",
                        ])

                        await service.reloadAll()

                        expect(service.getPool(ModelProvider.OpenRouter).map((key) => key.value))
                            .toEqual([
                                "sk-or-1111",
                            ])
                    })

                it("reads the Anthropic provider's pooled keys",
                    async () => {
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                provider: ModelProvider.Anthropic,
                                keysFilePath: "",
                            }),
                        ])
                        mountFilesystemService.anthropicApiKeys.mockReturnValueOnce([
                            "sk-ant-1111",
                        ])

                        await service.reloadAll()

                        expect(service.getPool(ModelProvider.Anthropic).map((key) => key.value))
                            .toEqual([
                                "sk-ant-1111",
                            ])
                    })

                it("collapses an unsupported provider to an empty pool instead of crashing",
                    async () => {
                        // no provider outside the ModelProvider enum exists in practice, but the
                        // switch's default branch is a defensive guard worth locking down
                        const unsupportedProvider = "unsupported-provider" as ModelProvider
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                provider: unsupportedProvider,
                                keysFilePath: "",
                            }),
                        ])

                        await service.reloadAll()

                        expect(service.getPool(unsupportedProvider)).toEqual([])
                    })
            })

        describe("reload logging",
            () => {
                it("logs AiBalancerKeysReloaded with the provider, key count, and path label",
                    async () => {
                        await service.ensureLoaded()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.AiBalancerKeysReloaded,
                            {
                                provider: ModelProvider.OpenAI,
                                keysCount: 2,
                                keysFilePath: "/mnt/openai.keys",
                            },
                        )
                    })
            })

        describe("error propagation",
            () => {
                it("propagates a catalog read failure and leaves the store retry-able",
                    async () => {
                        // simulate a DB outage on the first read
                        aiModelCatalogService.enabledModels.mockRejectedValueOnce(
                            new Error("connection terminated"),
                        )

                        await expect(service.ensureLoaded()).rejects.toThrow("connection terminated")

                        // the failed attempt must NOT have flipped the "loaded" flag -- a
                        // subsequent call retries the catalog instead of silently staying empty
                        await service.ensureLoaded()

                        expect(aiModelCatalogService.enabledModels).toHaveBeenCalledTimes(2)
                        expect(service.getPool(ModelProvider.OpenAI)).toHaveLength(2)
                    })

                it("propagates a mount-file read failure instead of swallowing it",
                    async () => {
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                keysFilePath: "/mnt/openai-corrupt.keys",
                            }),
                        ])
                        // a raw filesystem I/O failure that propagates unwrapped
                        const readError = new Error("EIO: read failed")
                        mountFilesystemService.readKeysFile.mockImplementationOnce(() => {
                            throw readError
                        })

                        await expect(service.reloadAll()).rejects.toThrow("EIO: read failed")

                        // the throw happened before the pool was written for this provider
                        expect(service.getPool(ModelProvider.OpenAI)).toEqual([])
                    })
            })
    })
