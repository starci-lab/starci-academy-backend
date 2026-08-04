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
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    AiModelCatalogService,
    AI_MODEL_CATALOG_CACHE_KEY,
} from "./ai-model-catalog.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * {@link EntityManagerMock} extended with the nested `connection.
 * queryResultCache` the SUT reads in {@link AiModelCatalogService.invalidate}
 * — a shape the shared mock does not model since most services never touch it.
 */
type CatalogEntityManagerMock = EntityManagerMock & {
    connection: {
        queryResultCache: {
            remove: jest.Mock
        }
    }
}

/**
 * Build an enabled catalog row — only the fields the service reads (name,
 * provider, category, credit, per-token rates) carry meaningful values.
 */
const buildModelRow = (
    overrides: Partial<AiModelEntity> = {
    },
): AiModelEntity => ({
    name: "gpt-4o",
    provider: ModelProvider.OpenAI,
    category: AiModelCategory.Balanced,
    enabled: true,
    credit: 0,
    creditPerMTokIn: 0,
    creditPerMTokOut: 0,
    ...overrides,
}) as AiModelEntity

describe("AiModelCatalogService",
    () => {
        let module: TestingModule
        let service: AiModelCatalogService
        let entityManager: CatalogEntityManagerMock

        beforeEach(async () => {
            // the query-cache remover invoked by invalidate()
            const remove = jest.fn().mockResolvedValue(undefined)

            // shared entity-manager mock, extended with the connection the SUT reads
            entityManager = {
                ...makeEntityManagerMock(),
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
                        entityManager.find.mockResolvedValueOnce(rows)

                        const result = await service.enabledModels()

                        expect(result).toBe(rows)
                        // the query pins enabled + priority order + the shared cache id
                        expect(entityManager.find).toHaveBeenCalledWith(
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
                        entityManager.find.mockResolvedValueOnce([
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

                it("propagates a DB failure instead of swallowing it",
                    async () => {
                        // the service does not catch/wrap — a Postgres outage must
                        // surface to the caller rather than resolve as "no models"
                        const dbError = new Error("connection terminated unexpectedly")
                        entityManager.find.mockRejectedValueOnce(dbError)

                        await expect(service.enabledModels()).rejects.toThrow(dbError)
                    })
            })

        describe("creditForModel",
            () => {
                it("returns the catalog credit of the model served",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "gpt-4o",
                                credit: 12,
                            }),
                        ])

                        const result = await service.creditForModel({
                            name: "gpt-4o",
                            fallback: 999,
                        })

                        expect(result).toBe(12)
                    })

                it("returns the fallback when the model is not in the enabled catalog",
                    async () => {
                        // catalog has rows, but none match the served name (disabled / renamed / removed)
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "some-other-model",
                            }),
                        ])

                        const result = await service.creditForModel({
                            name: "gpt-4o",
                            fallback: 20,
                        })

                        expect(result).toBe(20)
                    })
            })

        describe("creditForRun",
            () => {
                it("returns the fallback when the model is not in the enabled catalog",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([])

                        const result = await service.creditForRun({
                            name: "unknown-model",
                            promptTokens: 1000,
                            completionTokens: 500,
                            fallback: 42,
                        })

                        expect(result).toBe(42)
                    })

                it("bills a rated model by its reported token usage, ceiling the total",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "gpt-4o",
                                credit: 999,
                                creditPerMTokIn: 3000,
                                creditPerMTokOut: 4000,
                            }),
                        ])

                        const result = await service.creditForRun({
                            name: "gpt-4o",
                            promptTokens: 2000,
                            completionTokens: 1000,
                            fallback: 1,
                        })

                        // (2000*3000 + 1000*4000) / 1e6 = 10 exactly — the flat 999 credit is ignored
                        expect(result).toBe(10)
                    })

                it("bills prompt-cache hits at the model's own cache rate, not the input rate",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "cached-model",
                                creditPerMTokIn: 1000,
                                creditPerMTokOut: 1000,
                                creditPerMTokCached: 200,
                            }),
                        ])

                        const result = await service.creditForRun({
                            name: "cached-model",
                            promptTokens: 10_000,
                            cachedTokens: 8_000,
                            completionTokens: 1_000,
                            fallback: 1,
                        })

                        // 2000 fresh × 1000 + 8000 cached × 200 + 1000 out × 1000
                        // = (2e6 + 1.6e6 + 1e6) / 1e6 = 4.6 → 5
                        expect(result).toBe(5)
                    })

                it("charges the learner less once the conversation warms the cache",
                    async () => {
                        const row = buildModelRow({
                            name: "cached-model",
                            creditPerMTokIn: 1000,
                            creditPerMTokOut: 1000,
                            creditPerMTokCached: 200,
                        })
                        entityManager.find.mockResolvedValue([row])

                        const cold = await service.creditForRun({
                            name: "cached-model",
                            promptTokens: 10_000,
                            completionTokens: 1_000,
                            fallback: 1,
                        })
                        const warm = await service.creditForRun({
                            name: "cached-model",
                            promptTokens: 10_000,
                            cachedTokens: 8_000,
                            completionTokens: 1_000,
                            fallback: 1,
                        })

                        // identical prompt, identical output — the only difference is
                        // that the provider served most of it from cache, and the
                        // discount reaches the learner instead of stopping at us
                        expect(warm).toBeLessThan(cold)
                    })

                it("falls back to the conservative multiplier when no cache price is recorded",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "uncached-model",
                                creditPerMTokIn: 1000,
                                creditPerMTokOut: 1000,
                                creditPerMTokCached: null,
                            }),
                        ])

                        const result = await service.creditForRun({
                            name: "uncached-model",
                            promptTokens: 10_000,
                            cachedTokens: 8_000,
                            completionTokens: 1_000,
                            fallback: 1,
                        })

                        // cached share bills at 0.5 × the input rate:
                        // (2000×1000 + 8000×500 + 1000×1000) / 1e6 = 7
                        expect(result).toBe(7)
                    })

                it("never lets a bogus cached count exceed the prompt it came from",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "cached-model",
                                creditPerMTokIn: 1000,
                                creditPerMTokOut: 0,
                                creditPerMTokCached: 200,
                            }),
                        ])

                        const result = await service.creditForRun({
                            name: "cached-model",
                            promptTokens: 1_000,
                            cachedTokens: 999_999,
                            completionTokens: 0,
                            fallback: 1,
                        })

                        // clamped to the 1000 prompt tokens, all cached: 1000×200/1e6
                        expect(result).toBe(1)
                    })

                it("never bills a rated model 0 credits — a tiny fractional total rounds up",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "gpt-4o",
                                creditPerMTokIn: 1,
                                creditPerMTokOut: 1,
                            }),
                        ])

                        const result = await service.creditForRun({
                            name: "gpt-4o",
                            promptTokens: 100,
                            completionTokens: 100,
                            fallback: 1,
                        })

                        // (100*1 + 100*1) / 1e6 = 0.0002 — Math.ceil pushes it up to 1, never 0
                        expect(result).toBe(1)
                    })

                it("treats a model as rated when only one of the two per-token rates is set",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "gpt-4o",
                                credit: 7,
                                creditPerMTokIn: 0,
                                creditPerMTokOut: 500,
                            }),
                        ])

                        const result = await service.creditForRun({
                            name: "gpt-4o",
                            promptTokens: 100,
                            completionTokens: 100,
                            fallback: 1,
                        })

                        // hasRates is an OR — the flat `credit` (7) must NOT be used here
                        expect(result).toBe(1)
                    })

                it("falls back to the flat credit when the model has no per-token rates",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "self-hosted",
                                credit: 15,
                                creditPerMTokIn: 0,
                                creditPerMTokOut: 0,
                            }),
                        ])

                        const result = await service.creditForRun({
                            name: "self-hosted",
                            promptTokens: 5000,
                            completionTokens: 5000,
                            fallback: 1,
                        })

                        expect(result).toBe(15)
                    })

                it("estimates with default token counts when a rated model's usage was not reported",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            buildModelRow({
                                name: "gpt-4o",
                                credit: 999,
                                creditPerMTokIn: 1000,
                                creditPerMTokOut: 1000,
                            }),
                        ])

                        // promptTokens / completionTokens omitted — provider reported no usage
                        const result = await service.creditForRun({
                            name: "gpt-4o",
                            fallback: 1,
                        })

                        // (1500*1000 + 800*1000) / 1e6 = 2.3 -> ceil = 3, using the shared
                        // DEFAULT_ESTIMATE_* constants instead of the flat 999 credit
                        expect(result).toBe(3)
                    })
            })

        describe("invalidate",
            () => {
                it("removes the catalog cache entry so the next read hits the DB",
                    async () => {
                        // dropping the cache id forces a fresh query on next call
                        await service.invalidate()

                        expect(entityManager.connection.queryResultCache.remove).toHaveBeenCalledWith([
                            AI_MODEL_CATALOG_CACHE_KEY,
                        ])
                    })

                it("does not throw when the DataSource has no query-result cache configured",
                    async () => {
                        // `connection.queryResultCache` is optional (only set when query
                        // caching is enabled on the DataSource) — the SUT reads it via `?.`
                        const bareEntityManager = {
                            ...makeEntityManagerMock(),
                            connection: {
                                queryResultCache: undefined,
                            },
                        }

                        const bareModule = await Test.createTestingModule({
                            providers: [
                                AiModelCatalogService,
                                {
                                    provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                                    useValue: bareEntityManager,
                                },
                            ],
                        }).compile()
                        const bareService = bareModule.get<AiModelCatalogService>(AiModelCatalogService)

                        await expect(bareService.invalidate()).resolves.toBeUndefined()

                        await bareModule.close()
                    })
            })
    })
