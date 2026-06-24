import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelEntity,
    ModelProvider,
} from "@modules/databases"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    WinstonService,
} from "@modules/winston"
import {
    KeyStoreService,
} from "./key-store.service"
import {
    AiModelCatalogService,
} from "./ai-model-catalog.service"
import {
    KeyStatus,
} from "./enums"

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
            Pick<MountFilesystemService, "openAiApiKeys" | "geminiApiKeys">
        >
        let aiModelCatalogService: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

        beforeEach(async () => {
            // mount file readers: OpenAI returns two keys, others empty
            mountFilesystemService = {
                openAiApiKeys: jest.fn(() => [
                    "sk-openai-aaaa",
                    "sk-openai-bbbb",
                ]),
                geminiApiKeys: jest.fn(() => []),
            } as unknown as jest.Mocked<
                Pick<MountFilesystemService, "openAiApiKeys" | "geminiApiKeys">
            >

            // catalog: a single OpenAI model row by default
            aiModelCatalogService = {
                enabledModels: jest.fn(async () => [
                    buildModelRow(),
                ]),
            } as unknown as jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

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
                        useValue: {
                            log: jest.fn(),
                        },
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
                        // three rows but only one unique provider/file → one read
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
            })

        describe("getPool",
            () => {
                it("returns an empty array for an unknown / unloaded provider",
                    async () => {
                        // Gemini was never loaded → empty pool, no crash
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
            })
    })
