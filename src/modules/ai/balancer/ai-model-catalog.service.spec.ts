import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    AiModelCategory,
    AiModelEntity,
    ModelProvider,
} from "@modules/databases"
import {
    AiModelCatalogService,
    AI_MODEL_CATALOG_CACHE_KEY,
} from "./ai-model-catalog.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build an enabled catalog row — only the fields the service filters/returns
 * (name, provider, category) carry real values.
 */
const buildModelRow = (
    overrides: Partial<AiModelEntity> = {
    },
): AiModelEntity => ({
    name: "gpt-4o",
    provider: ModelProvider.OpenAI,
    category: AiModelCategory.Balanced,
    enabled: true,
    ...overrides,
}) as AiModelEntity

describe("AiModelCatalogService",
    () => {
        let module: TestingModule
        let service: AiModelCatalogService
        let find: jest.Mock
        let remove: jest.Mock

        beforeEach(async () => {
            // find resolves the programmed rows; default empty
            find = jest.fn().mockResolvedValue([])
            // the query-cache remover invoked by invalidate()
            remove = jest.fn().mockResolvedValue(undefined)

            // entity manager exposing find + the nested connection.queryResultCache
            const entityManager = {
                find,
                connection: {
                    queryResultCache: {
                        remove,
                    },
                },
            }

            module = await Test.createTestingModule({
                providers: [
                    AiModelCatalogService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<AiModelCatalogService>(AiModelCatalogService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("enabledModels",
            () => {
                it("queries enabled rows ordered by priority with the cache key",
                    async () => {
                        // happy path: hand back two rows untouched when no filter
                        const rows = [
                            buildModelRow(),
                            buildModelRow({
                                name: "gpt-4o-mini",
                            }),
                        ]
                        find.mockResolvedValueOnce(rows)

                        const result = await service.enabledModels()

                        expect(result).toBe(rows)
                        // the query pins enabled + priority order + the shared cache id
                        expect(find).toHaveBeenCalledWith(
                            AiModelEntity,
                            expect.objectContaining({
                                where: {
                                    enabled: true,
                                },
                                order: {
                                    priority: "DESC",
                                },
                                cache: expect.objectContaining({
                                    id: AI_MODEL_CATALOG_CACHE_KEY,
                                }),
                            }),
                        )
                    })

                it("filters the result by category when one is supplied",
                    async () => {
                        // mixed categories returned; only the requested one survives
                        find.mockResolvedValueOnce([
                            buildModelRow({
                                category: AiModelCategory.Economy,
                            }),
                            buildModelRow({
                                category: AiModelCategory.Premium,
                            }),
                        ])

                        const result = await service.enabledModels({
                            category: AiModelCategory.Premium,
                        })

                        expect(result).toHaveLength(1)
                        expect(result[0].category).toBe(AiModelCategory.Premium)
                    })
            })

        describe("invalidate",
            () => {
                it("removes the catalog cache entry so the next read hits the DB",
                    async () => {
                        // dropping the cache id forces a fresh query on next call
                        await service.invalidate()

                        expect(remove).toHaveBeenCalledWith([
                            AI_MODEL_CATALOG_CACHE_KEY,
                        ])
                    })
            })
    })
