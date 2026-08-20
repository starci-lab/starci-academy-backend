import {
    rmSync,
    writeFileSync,
} from "fs"
import {
    join,
} from "path"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import request from "supertest"
import type {
    INestApplication,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    Redis as IoRedis,
} from "ioredis"
import type {
    Cache,
} from "cache-manager"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    OllamaEmbeddings,
} from "@langchain/ollama"
import {
    OpenAIEmbeddings,
} from "@langchain/openai"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
import {
    PublicRagPlaygroundService,
} from "@modules/integrations/rag/public-rag-playground.service"
import {
    GithubRepoImportService,
} from "@modules/integrations/rag/github-repo-import.service"
import {
    QDRANT_CLIENT,
} from "@modules/databases/qdrant/constants/client"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    RagPlaygroundSessionEntity,
} from "@modules/databases/postgresql/primary/entities/rag-playground-session.entity"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    FilesystemModule,
} from "@modules/filesystem/filesystem.module"
import type {
    AppConfig,
} from "@modules/filesystem/types/config"
import {
    clearRuntimeAppConfig,
    setRuntimeAppConfig,
} from "@modules/filesystem/utils/mount-secrets"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    MixinModule,
} from "@modules/lib/mixin/mixin.module"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    AiPingCacheService,
} from "@modules/integrations/cache/ai-ping-cache.service"
import {
    AiModelLatencyCacheService,
} from "@modules/integrations/cache/ai-model-latency-cache.service"
import {
    KeyStoreService,
} from "@modules/ai/balancer/key-store.service"
import {
    KeyRotatorService,
} from "@modules/ai/balancer/key-rotator.service"
import {
    AiBalancerService,
} from "@modules/ai/balancer/ai-balancer.service"
import {
    UseApiService,
} from "@modules/ai/balancer/use-api.service"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IndexRagPlaygroundResolver,
} from "@features/api/core/graphql/mutations/rag-playground/index-rag-playground/index-rag-playground.resolver"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
import {
    aiE2eRedisCacheManagerToken,
    createAiE2eRedisProviders,
} from "@tests/helpers/ai-provider-invoke-script"

interface IndexResponse {
    data?: {
        indexRagPlayground: {
            success: boolean
            error?: string
            message: string
            data?: {
                sessionId: string
            }
        }
    }
    errors?: Array<{
        message: string
    }>
}

/**
 * Production GraphQL -> RAG -> Qdrant adapter -> EmbeddingModelService ->
 * UseApiService. Only the remote embedding SDK and Qdrant network boundary are
 * scripted; catalog, key loading, health/cooldown and fallback remain real.
 */
describe("embedding provider fallback keeps the RAG index consistent",
    () => {
        const LOCAL_MODEL = "qwen3-embedding-local-e2e"
        const CLOUD_MODEL = "qwen3-embedding-cloud-e2e"
        const KEY_FILE = join(process.cwd(),
            ".e2e-embedding-fallback.keys")
        let app: INestApplication
        let entityManager: EntityManager
        let cacheService: CacheService
        let redis: IoRedis
        let redisCache: Cache

        const index = async (sessionId: string): Promise<IndexResponse> => {
            const response = await request(app.getHttpServer())
                .post("/graphql")
                .send({
                    query: `
                        mutation Index($request: IndexRagPlaygroundRequest!) {
                            indexRagPlayground(request: $request) {
                                success
                                error
                                message
                                data { sessionId }
                            }
                        }
                    `,
                    variables: {
                        request: {
                            sessionId,
                            kind: "paste",
                            code: "export const fallback = true",
                            language: "typescript",
                            fileName: "fallback.ts",
                        },
                    },
                })
                .expect(200)
            return response.body as IndexResponse
        }

        beforeAll(async () => {
            // This flow owns exactly two provider attempts: local first, then
            // cloud. Pinning the production attempt budget makes a repeated
            // local/cloud loop a regression instead of accepting it as green.
            process.env.AI_BALANCER_MAX_AUTO_ATTEMPTS = "2"
            setRuntimeAppConfig({
                systemConfig: {
                    ai: {
                        auto: {
                            creditsPer5h: 100,
                            creditsPerWeek: 500,
                            creditCost: 1,
                        },
                    },
                },
                subscriptions: {
                    tiers: [],
                },
            } as unknown as AppConfig)
            writeFileSync(KEY_FILE,
                "e2e-embedding-key\n",
                "utf8")

            jest.spyOn(QdrantVectorStore,
                "fromDocuments")
                .mockImplementation(async (documents, embeddings) => {
                    await embeddings.embedDocuments(documents.map((document) => document.pageContent))
                    return {
                    } as QdrantVectorStore
                })

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    MixinModule.register(
                        {
                            isGlobal: true,
                            loadNextJsQueryService: false,
                        },
                    ),
                    FilesystemModule.register({
                        isGlobal: true,
                    }),
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                ],
                providers: [
                    ...createAiE2eRedisProviders(),
                    CacheService,
                    AiPingCacheService,
                    AiModelLatencyCacheService,
                    DayjsService,
                    AiModelCatalogService,
                    KeyStoreService,
                    KeyRotatorService,
                    AiBalancerService,
                    UseApiService,
                    EmbeddingModelService,
                    PublicRagPlaygroundService,
                    GithubRepoImportService,
                    IndexRagPlaygroundResolver,
                    {
                        provide: QDRANT_CLIENT,
                        useValue: {
                            deleteCollection: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(getEntityManagerToken(POSTGRESQL_PRIMARY))
            cacheService = app.get(CacheService)
            redis = app.get<IoRedis>(createIoRedisKey(IoRedisInstanceKey.Cache))
            redisCache = app.get<Cache>(aiE2eRedisCacheManagerToken)

            await entityManager.query("TRUNCATE TABLE rag_playground_sessions, ai_models RESTART IDENTITY CASCADE")
            await entityManager.save(AiModelEntity,
                [
                    {
                        name: LOCAL_MODEL,
                        provider: ModelProvider.Local,
                        category: AiModelCategory.EmbeddingLocal,
                        keysFilePath: KEY_FILE,
                        priority: 100,
                        credit: 0,
                        weight: 100,
                        priceInUsdPerMTok: 0,
                        priceOutUsdPerMTok: 0,
                        creditPerMTokIn: 0,
                        creditPerMTokOut: 0,
                        enabled: true,
                        complimentary: true,
                        supportedTasks: [AiModelTask.Embedding],
                        defaultLocale: Locale.En,
                    },
                    {
                        name: CLOUD_MODEL,
                        provider: ModelProvider.OpenAI,
                        category: AiModelCategory.EmbeddingCloud,
                        keysFilePath: KEY_FILE,
                        priority: 90,
                        credit: 0,
                        weight: 90,
                        priceInUsdPerMTok: 0,
                        priceOutUsdPerMTok: 0,
                        creditPerMTokIn: 0,
                        creditPerMTokOut: 0,
                        enabled: true,
                        complimentary: true,
                        supportedTasks: [AiModelTask.Embedding],
                        defaultLocale: Locale.En,
                    },
                ])
            await app.get(AiModelCatalogService).invalidate()
        })

        beforeEach(async () => {
            jest.spyOn(OllamaEmbeddings.prototype,
                "embedDocuments")
                .mockReset()
            jest.spyOn(OpenAIEmbeddings.prototype,
                "embedDocuments")
                .mockReset()
            await cacheService.del({
                key: CacheKey.AiPingKeyStatus,
            })
            await entityManager.query("TRUNCATE TABLE rag_playground_sessions RESTART IDENTITY CASCADE")
        })

        afterAll(async () => {
            jest.restoreAllMocks()
            await redisCache?.disconnect()
            redis?.disconnect()
            clearRuntimeAppConfig()
            delete process.env.AI_BALANCER_MAX_AUTO_ATTEMPTS
            await app?.close().catch(() => undefined)
            rmSync(KEY_FILE,
                {
                    force: true,
                })
        })

        it("falls from a failed local SDK request to cloud and persists the completed index",
            async () => {
                jest.mocked(OllamaEmbeddings.prototype.embedDocuments)
                    .mockRejectedValue(Object.assign(new Error("local embedding unavailable"),
                        {
                            status: 503,
                        }))
                jest.mocked(OpenAIEmbeddings.prototype.embedDocuments)
                    .mockResolvedValue([
                        [0.1,
                            0.2],
                    ])

                const response = await index("embedding-fallback-success")

                expect(response.errors).toBeUndefined()
                expect(response.data?.indexRagPlayground.data?.sessionId).toBe("embedding-fallback-success")
                expect(await entityManager.findOneBy(RagPlaygroundSessionEntity,
                    {
                        sessionId: "embedding-fallback-success",
                    })).toMatchObject({
                    sourceLabel: "fallback.ts",
                    chunkCount: 1,
                })
                expect(OllamaEmbeddings.prototype.embedDocuments).toHaveBeenCalledTimes(1)
                expect(OpenAIEmbeddings.prototype.embedDocuments).toHaveBeenCalledTimes(1)
            })

        it("leaves no session row when every embedding provider is exhausted",
            async () => {
                const unavailable = Object.assign(new Error("embedding unavailable"),
                    {
                        status: 503,
                    })
                jest.mocked(OllamaEmbeddings.prototype.embedDocuments)
                    .mockRejectedValue(unavailable)
                jest.mocked(OpenAIEmbeddings.prototype.embedDocuments)
                    .mockRejectedValue(unavailable)

                const response = await index("embedding-fallback-exhausted")

                expect(response.data?.indexRagPlayground.success).toBe(false)
                expect(response.data?.indexRagPlayground.error).toBeDefined()
                expect(await entityManager.findOneBy(RagPlaygroundSessionEntity,
                    {
                        sessionId: "embedding-fallback-exhausted",
                    })).toBeNull()
                expect(OllamaEmbeddings.prototype.embedDocuments).toHaveBeenCalledTimes(1)
                expect(OpenAIEmbeddings.prototype.embedDocuments).toHaveBeenCalledTimes(1)
            })
    })
