import {
    mkdtempSync,
    rmSync,
    writeFileSync,
} from "fs"
import {
    tmpdir,
} from "os"
import {
    join,
} from "path"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ChatOpenAI,
} from "@langchain/openai"
import request from "supertest"
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
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    AiBalancerService,
} from "@modules/ai/balancer/ai-balancer.service"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
import {
    KeyRotatorService,
} from "@modules/ai/balancer/key-rotator.service"
import {
    KeyStoreService,
} from "@modules/ai/balancer/key-store.service"
import {
    UseApiService,
} from "@modules/ai/balancer/use-api.service"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    ContentAiService,
} from "@modules/bussiness/content-ai/content-ai.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    CreditUsageHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/credit-usage-history.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
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
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
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
    AiModelLatencyCacheService,
} from "@modules/integrations/cache/ai-model-latency-cache.service"
import {
    AiPingCacheService,
} from "@modules/integrations/cache/ai-ping-cache.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    MixinModule,
} from "@modules/lib/mixin/mixin.module"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    AskContentAiHandler,
} from "@features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.handler"
import {
    AskContentAiResolver,
} from "@features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.resolver"
import {
    AskContentAiService,
} from "@features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.service"
import {
    aiE2eRedisCacheManagerToken,
    createAiE2eRedisProviders,
    AiProviderInvokeScript,
} from "@tests/helpers/ai-provider-invoke-script"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const ASK_CONTENT_AI_MUTATION = `
    mutation Ask($request: AskContentAiRequest!) {
        askContentAi(request: $request) {
            success
            error
            data { answer }
        }
    }
`

const LOCAL_KEYS = [
    "e2e-local-a",
    "e2e-local-b",
]
const OPENROUTER_KEY = "e2e-openrouter-a"
const OPENAI_KEY = "e2e-openai-a"

/** Provider error with the same status/header surface exposed by real SDKs. */
const providerError = (
    message: string,
    status: number,
    retryAfter?: string,
): Error => Object.assign(
    new Error(message),
    {
        status,
        headers: retryAfter
            ? {
                "retry-after": retryAfter,
            }
            : undefined,
    },
)

/**
 * Operational proof for the complete production AI fallback chain.
 *
 * ACT always enters through `askContentAi` GraphQL. Catalog lookup, mounted-key
 * loading, Redis health/LRU rotation, entitlement resolution/debit and CQRS are
 * real. Only `ChatOpenAI.invoke` is scripted because that concrete SDK call is
 * the external nondeterministic model boundary.
 */
describe("AI provider fallback preserves health, billing and attribution",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let currentUser: UserEntity | null = null
        let redis: IoRedis
        let redisCache: Cache
        let keyStore: KeyStoreService
        let pingCache: AiPingCacheService
        let catalog: AiModelCatalogService
        let keysDirectory: string

        const providerScript = new AiProviderInvokeScript()
        const invokeSpy = jest.spyOn(ChatOpenAI.prototype,
            "invoke")
            .mockImplementation(() => providerScript.next() as never)

        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                if (!currentUser) {
                    return false
                }
                gqlContext.req.user = currentUser
                return true
            },
        }

        const ask = () => request(app.getHttpServer())
            .post("/graphql")
            .send({
                query: ASK_CONTENT_AI_MUTATION,
                variables: {
                    request: {
                        question: "Explain a closure.",
                    },
                },
            })

        const readLedger = (): Promise<Array<CreditUsageHistoryEntity>> =>
            entityManager.find(CreditUsageHistoryEntity,
                {
                    order: {
                        createdAt: "ASC",
                    },
                })

        const saveModel = async (
            params: {
                name: string
                provider: ModelProvider
                category: AiModelCategory
                keysFilePath: string
                priority: number
                weight: number
                credit: number
                creditPerMTokIn: number
                creditPerMTokOut: number
                creditPerMTokCached: number | null
            },
        ): Promise<void> => {
            await entityManager.save(
                entityManager.create(AiModelEntity,
                    {
                        ...params,
                        priceInUsdPerMTok: 0,
                        priceOutUsdPerMTok: 0,
                        priceCacheReadUsdPerMTok: null,
                        contextWindowTokens: 128_000,
                        enabled: true,
                        complimentary: params.category === AiModelCategory.Low,
                        supportedTasks: [
                            AiModelTask.Chatting,
                        ],
                        defaultLocale: Locale.En,
                    }),
            )
        }

        beforeAll(async () => {
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

            keysDirectory = mkdtempSync(join(tmpdir(),
                "starci-ai-e2e-"))
            const localKeysPath = join(keysDirectory,
                "local.key")
            const openRouterKeysPath = join(keysDirectory,
                "openrouter.key")
            const openAiKeysPath = join(keysDirectory,
                "openai.key")
            writeFileSync(localKeysPath,
                LOCAL_KEYS.join("\n"))
            writeFileSync(openRouterKeysPath,
                OPENROUTER_KEY)
            writeFileSync(openAiKeysPath,
                OPENAI_KEY)

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    MixinModule.register({
                        isGlobal: true,
                        loadNextJsQueryService: false,
                    }),
                    FilesystemModule.register({
                        isGlobal: true,
                    }),
                    CqrsModule,
                ],
                providers: [
                    ...createAiE2eRedisProviders(),
                    CacheService,
                    AskContentAiResolver,
                    AskContentAiService,
                    AskContentAiHandler,
                    ContentAiService,
                    UserService,
                    S3NameResolverService,
                    AiInvokeService,
                    AiEntitlementService,
                    AiAutoQuotaConfigService,
                    AiModelCatalogService,
                    KeyStoreService,
                    KeyRotatorService,
                    AiBalancerService,
                    UseApiService,
                    AiPingCacheService,
                    AiModelLatencyCacheService,
                    DayjsService,
                    {
                        provide: S3ReadService,
                        useValue: {
                        },
                    },
                    {
                        provide: CourseRagRetrievalService,
                        useValue: {
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: () => undefined,
                        },
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            redis = app.get<IoRedis>(
                createIoRedisKey(IoRedisInstanceKey.Cache),
            )
            redisCache = app.get<Cache>(aiE2eRedisCacheManagerToken)
            keyStore = app.get(KeyStoreService)
            pingCache = app.get(AiPingCacheService)
            catalog = app.get(AiModelCatalogService)

            await saveModel({
                name: "e2e-local-chat",
                provider: ModelProvider.Local,
                category: AiModelCategory.Low,
                keysFilePath: localKeysPath,
                priority: 300,
                weight: 30,
                credit: 0,
                creditPerMTokIn: 0,
                creditPerMTokOut: 0,
                creditPerMTokCached: null,
            })
            await saveModel({
                name: "e2e-openrouter-chat",
                provider: ModelProvider.OpenRouter,
                category: AiModelCategory.Low,
                keysFilePath: openRouterKeysPath,
                priority: 200,
                weight: 20,
                credit: 0,
                creditPerMTokIn: 0,
                creditPerMTokOut: 0,
                creditPerMTokCached: null,
            })
            await saveModel({
                name: "e2e-openai-balanced",
                provider: ModelProvider.OpenAI,
                category: AiModelCategory.Medium,
                keysFilePath: openAiKeysPath,
                priority: 100,
                weight: 10,
                credit: 9,
                creditPerMTokIn: 10_000,
                creditPerMTokOut: 10_000,
                creditPerMTokCached: 1_000,
            })
            await catalog.invalidate()
            await keyStore.reloadAll()
        })

        beforeEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE credit_usage_histories, ai_subscriptions, users RESTART IDENTITY CASCADE",
            )
            await redis.flushdb()
            await pingCache.onModuleInit()
            currentUser = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `ai-fallback-${Date.now()}-${Math.random()}`,
                    }),
            )
            invokeSpy.mockClear()
        })

        afterAll(async () => {
            invokeSpy.mockRestore()
            clearRuntimeAppConfig()
            await redisCache.disconnect()
            redis.disconnect()
            await entityManager.connection.destroy()
            rmSync(keysDirectory,
                {
                    recursive: true,
                    force: true,
                })
        })

        it("climbs across transient key and category failures and bills the served model with cached-token pricing",
            async () => {
                providerScript.set([
                    providerError("local key A unavailable",
                        503),
                    providerError("local key B unavailable",
                        503),
                    providerError("free cloud unavailable",
                        503),
                    {
                        text: "A closure keeps its lexical environment.",
                        promptTokens: 100,
                        completionTokens: 20,
                        cachedTokens: 80,
                    },
                ])
                const response = await ask()

                expect(response.body.errors).toBeUndefined()
                expect(response.body.data.askContentAi.data.answer)
                    .toBe("A closure keeps its lexical environment.")
                const ledger = await readLedger()
                expect(ledger).toHaveLength(1)
                expect(ledger[0]).toMatchObject({
                    model: "e2e-openai-balanced",
                    provider: ModelProvider.OpenAI,
                    attempts: 4,
                    credits: 1,
                    promptTokens: 100,
                    completionTokens: 20,
                })
                const subscription = await entityManager.findOneOrFail(
                    AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: currentUser?.id,
                            },
                        },
                    },
                )
                expect(subscription.credit5hUsed).toBe(1)
                expect(subscription.creditWeekUsed).toBe(1)
                expect(invokeSpy).toHaveBeenCalledTimes(4)
            })

        it("rotates after a 429 and records Retry-After cooldown before the next key serves",
            async () => {
                providerScript.set([
                    providerError("rate limited",
                        429,
                        "5"),
                    {
                        text: "Served by the second local key.",
                    },
                ])
                const startedAt = Date.now()

                const response = await ask()

                expect(response.body.errors).toBeUndefined()
                const ledger = await readLedger()
                expect(ledger).toHaveLength(1)
                expect(ledger[0]).toMatchObject({
                    model: "e2e-local-chat",
                    provider: ModelProvider.Local,
                    attempts: 2,
                    credits: 0,
                })
                const health = await pingCache.getProviderMap(ModelProvider.Local)
                expect(Object.values(health)).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            status: false,
                            failCount: 1,
                        }),
                        expect.objectContaining({
                            status: true,
                        }),
                    ]),
                )
                const cooling = Object.values(health).find((entry) => !entry.status)
                const cooldownUntil = Date.parse(cooling?.cooldownUntil ?? "")
                expect(cooldownUntil).toBeGreaterThanOrEqual(startedAt + 4_500)
                expect(cooldownUntil).toBeLessThanOrEqual(Date.now() + 5_500)
            })

        it("hard-disables an unauthorized key and serves the request with the remaining key",
            async () => {
                providerScript.set([
                    providerError("invalid api key",
                        401),
                    {
                        text: "Served after disabling the invalid key.",
                    },
                ])

                const response = await ask()

                expect(response.body.errors).toBeUndefined()
                const health = await pingCache.getProviderMap(ModelProvider.Local)
                expect(Object.values(health)).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            status: false,
                            disabled: true,
                            failCount: 1,
                        }),
                        expect.objectContaining({
                            status: true,
                        }),
                    ]),
                )
                expect(await readLedger()).toEqual([
                    expect.objectContaining({
                        attempts: 2,
                        model: "e2e-local-chat",
                    }),
                ])
            })

        it("stops on a non-key prompt failure without penalizing credentials or charging",
            async () => {
                providerScript.set([
                    new SyntaxError("provider response could not be parsed"),
                ])

                const response = await ask()

                expect(response.body.data.askContentAi).toMatchObject({
                    success: false,
                    error: "SyntaxError",
                    data: null,
                })
                expect(invokeSpy).toHaveBeenCalledTimes(1)
                const health = await pingCache.getProviderMap(ModelProvider.Local)
                expect(Object.values(health)).toEqual([
                    expect.objectContaining({
                        status: true,
                        failCount: undefined,
                        cooldownUntil: undefined,
                    }),
                ])
                expect(await readLedger()).toHaveLength(0)
                expect(await entityManager.count(AiSubscriptionEntity)).toBe(0)
            })

        it("returns a terminal GraphQL error after every model is exhausted without charging",
            async () => {
                providerScript.set([
                    providerError("local A down",
                        503),
                    providerError("local B down",
                        503),
                    providerError("openrouter down",
                        503),
                    providerError("openai down",
                        503),
                ])

                const response = await ask()

                expect(response.body.data.askContentAi).toMatchObject({
                    success: false,
                    error: "ALL_MODELS_EXHAUSTED_EXCEPTION",
                    data: null,
                })
                expect(invokeSpy).toHaveBeenCalledTimes(4)
                expect(await readLedger()).toHaveLength(0)
                expect(await entityManager.count(AiSubscriptionEntity)).toBe(0)
            })
    })
