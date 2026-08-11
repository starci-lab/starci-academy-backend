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
    INestApplication,
} from "@nestjs/common"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    AIMessageChunk,
} from "@langchain/core/messages"
import {
    ChatOpenAI,
} from "@langchain/openai"
import type {
    Cache,
} from "cache-manager"
import type {
    Redis as IoRedis,
} from "ioredis"
import {
    io,
} from "socket.io-client"
import type {
    Socket,
} from "socket.io-client"
import type {
    EntityManager,
} from "typeorm"
import {
    ContentAiGateway,
} from "@features/socketio/core/content-ai/content-ai.gateway"
import {
    PublicationEvent,
} from "@features/socketio/core/enums/publication-event"
import {
    SubscriptionEvent,
} from "@features/socketio/core/enums/subscription-event"
import {
    MockInterviewGateway,
} from "@features/socketio/core/mock-interview/mock-interview.gateway"
import {
    MockInterviewTurnService,
} from "@features/socketio/core/mock-interview/mock-interview-turn.service"
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
    ContentAiService,
} from "@modules/bussiness/content-ai/content-ai.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    QdrantModule,
} from "@modules/databases/qdrant/qdrant.module"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    ContentAiMessageEntity,
} from "@modules/databases/postgresql/primary/entities/content-ai-message.entity"
import {
    ContentAiSessionEntity,
} from "@modules/databases/postgresql/primary/entities/content-ai-session.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    CreditUsageHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/credit-usage-history.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MockInterviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
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
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
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
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
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
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import {
    aiE2eRedisCacheManagerToken,
    createAiE2eRedisProviders,
} from "@tests/helpers/ai-provider-invoke-script"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
import {
    until,
} from "@tests/helpers/flow-wait"

interface StreamChunkFixture {
    text: string
    promptTokens?: number
    completionTokens?: number
    cachedTokens?: number
}

interface StreamAttemptFixture {
    chunks?: Array<StreamChunkFixture>
    error?: Error
    waitForAbort?: boolean
}

interface StreamSocketMessage {
    success: boolean
    data: {
        streamId: string
        delta: string
        done: boolean
        error?: string
    }
}

/** FIFO replacement for the one nondeterministic boundary: LangChain's provider stream. */
class ProviderStreamScript {
    private attempts: Array<StreamAttemptFixture> = []
    private startedResolve: (() => void) | undefined
    private started = Promise.resolve()

    set(attempts: Array<StreamAttemptFixture>): void {
        this.attempts = [...attempts]
        this.started = new Promise<void>((resolve) => {
            this.startedResolve = resolve
        })
    }

    waitUntilAttemptStarted(): Promise<void> {
        return this.started
    }

    next(signal?: AbortSignal): AsyncIterable<AIMessageChunk> {
        const attempt = this.attempts.shift()
        if (!attempt) {
            throw new Error("AI stream provider E2E script exhausted")
        }
        const startedResolve = this.startedResolve
        this.startedResolve = undefined
        return (async function* () {
            startedResolve?.()
            for (const chunk of attempt.chunks ?? []) {
                yield new AIMessageChunk({
                    content: chunk.text,
                    usage_metadata: chunk.promptTokens === undefined
                        && chunk.completionTokens === undefined
                        ? undefined
                        : {
                            input_tokens: chunk.promptTokens ?? 0,
                            output_tokens: chunk.completionTokens ?? 0,
                            total_tokens: (chunk.promptTokens ?? 0)
                                + (chunk.completionTokens ?? 0),
                            input_token_details: {
                                cache_read: chunk.cachedTokens ?? 0,
                            },
                        },
                })
            }
            if (attempt.waitForAbort) {
                await new Promise<void>((_resolve, reject) => {
                    if (signal?.aborted) {
                        reject(new Error("provider cancelled request"))
                        return
                    }
                    signal?.addEventListener("abort",
                        () => reject(new Error("provider cancelled request")),
                        {
                            once: true,
                        })
                })
            }
            if (attempt.error) {
                throw attempt.error
            }
        })()
    }
}

const transientProviderError = (message: string): Error => Object.assign(
    new Error(message),
    {
        status: 503,
    },
)

/**
 * Production-policy proof for AI socket streaming.
 *
 * REAL: Socket.IO transport and auth middleware, both gateways, both prompt/
 * turn services, AiInvoke -> UseApi, catalog, mounted key pools, Redis health,
 * entitlement debit/ledger, Postgres persistence and Qdrant degraded retrieval.
 * The external Keycloak verifier is deterministic because this lane owns no
 * Keycloak container. Jest replaces only `ChatOpenAI.stream`, the concrete
 * nondeterministic provider call; every fallback and consequence above it is
 * production code.
 */
describe("AI socket streaming preserves one-answer and one-charge semantics",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let redis: IoRedis
        let redisCache: Cache
        let pingCache: AiPingCacheService
        let keyStore: KeyStoreService
        let catalog: AiModelCatalogService
        let keysDirectory: string
        let learner: UserEntity
        let contentSession: ContentAiSessionEntity
        let interviewSession: MockInterviewSessionEntity
        let course: CourseEntity
        const sockets: Array<Socket> = []
        const streamScript = new ProviderStreamScript()
        const streamSpy = jest.spyOn(ChatOpenAI.prototype,
            "stream")
            .mockImplementation((
                _messages: unknown,
                options?: { signal?: AbortSignal },
            ) => streamScript.next(options?.signal) as never)

        const connect = async (namespace: "content_ai" | "mock_interview"): Promise<Socket> => {
            const socket = io(`${await app.getUrl()}/${namespace}`,
                {
                    transports: [
                        "websocket",
                    ],
                    auth: {
                        token: learner.keycloakId,
                    },
                    forceNew: true,
                })
            sockets.push(socket)
            await new Promise<void>((resolve, reject) => {
                socket.once("connect",
                    resolve)
                socket.once("connect_error",
                    reject)
            })
            return socket
        }

        const collect = (
            socket: Socket,
            event: SubscriptionEvent.ContentAiChunk | SubscriptionEvent.MockInterviewChunk,
        ): Promise<Array<StreamSocketMessage>> => {
            const messages: Array<StreamSocketMessage> = []
            const listener = (message: StreamSocketMessage) => {
                messages.push(message)
            }
            socket.on(event,
                listener)
            return (async () => {
                try {
                    await until(
                        () => messages.some((message) => message.data.done),
                        {
                            describe: `terminal ${event} message`,
                        },
                    )
                    return messages
                } finally {
                    socket.off(event,
                        listener)
                }
            })()
        }

        const askContent = async (
            streamId: string,
        ): Promise<Array<StreamSocketMessage>> => {
            const socket = await connect("content_ai")
            const result = collect(socket,
                SubscriptionEvent.ContentAiChunk)
            socket.emit(PublicationEvent.AskContentAi,
                {
                    locale: Locale.En,
                    data: {
                        streamId,
                        sessionId: contentSession.id,
                        question: "Explain why an idempotency key matters.",
                        history: [],
                    },
                })
            return result
        }

        const saveModel = async (
            params: {
                name: string
                provider: ModelProvider
                keysFilePath: string
                priority: number
                weight: number
            },
        ): Promise<void> => {
            await entityManager.save(entityManager.create(AiModelEntity,
                {
                    ...params,
                    category: AiModelCategory.Low,
                    credit: 1,
                    creditPerMTokIn: 10_000,
                    creditPerMTokOut: 10_000,
                    creditPerMTokCached: 1_000,
                    priceInUsdPerMTok: 0,
                    priceOutUsdPerMTok: 0,
                    priceCacheReadUsdPerMTok: null,
                    contextWindowTokens: 128_000,
                    enabled: true,
                    complimentary: false,
                    supportedTasks: [
                        AiModelTask.Chatting,
                        AiModelTask.Grading,
                    ],
                    defaultLocale: Locale.En,
                }))
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
                "starci-ai-stream-e2e-"))
            const localKeysPath = join(keysDirectory,
                "local.key")
            const openRouterKeysPath = join(keysDirectory,
                "openrouter.key")
            writeFileSync(localKeysPath,
                "e2e-stream-local")
            writeFileSync(openRouterKeysPath,
                "e2e-stream-openrouter")

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
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
                    QdrantModule.register({
                        isGlobal: true,
                    }),
                ],
                providers: [
                    ...createAiE2eRedisProviders(),
                    CacheService,
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
                    UserService,
                    ContentAiService,
                    CourseRagRetrievalService,
                    EmbeddingModelService,
                    S3NameResolverService,
                    MockInterviewTurnService,
                    WsResponseService,
                    ContentAiGateway,
                    MockInterviewGateway,
                    {
                        // Authentication is outside this flow; keep the real
                        // socket middleware and replace only its external OIDC
                        // verification result.
                        provide: KeycloakTokenService,
                        useValue: {
                            verifyAccessToken: async (token: string) => ({
                                active: true,
                                sub: token,
                            }),
                        },
                    },
                    {
                        // Anchorless content chat never reads S3. Supplying the
                        // unused adapter avoids opening a second external seam;
                        // all content prompt logic itself remains real.
                        provide: S3ReadService,
                        useValue: {
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            globalThis.__APP__ = app
            await app.listen(0)
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            redis = app.get<IoRedis>(
                createIoRedisKey(IoRedisInstanceKey.Cache),
            )
            redisCache = app.get<Cache>(aiE2eRedisCacheManagerToken)
            pingCache = app.get(AiPingCacheService)
            keyStore = app.get(KeyStoreService)
            catalog = app.get(AiModelCatalogService)

            await saveModel({
                name: "e2e-stream-local",
                provider: ModelProvider.Local,
                keysFilePath: localKeysPath,
                priority: 200,
                weight: 20,
            })
            await saveModel({
                name: "e2e-stream-openrouter",
                provider: ModelProvider.OpenRouter,
                keysFilePath: openRouterKeysPath,
                priority: 100,
                weight: 10,
            })
            await catalog.invalidate()
            await keyStore.reloadAll()
        })

        beforeEach(async () => {
            for (const socket of sockets.splice(0)) {
                socket.disconnect()
            }
            await entityManager.query(
                "TRUNCATE TABLE content_ai_messages, content_ai_sessions, mock_interview_sessions, enrollments, courses, credit_usage_histories, ai_subscriptions, users RESTART IDENTITY CASCADE",
            )
            await redis.flushdb()
            await pingCache.onModuleInit()
            streamSpy.mockClear()

            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `ai-stream-${Date.now()}-${Math.random()}`,
                    email: "ai-stream@starci.test",
                    username: "ai-stream-learner",
                }))
            contentSession = await entityManager.save(
                entityManager.create(ContentAiSessionEntity,
                    {
                        scope: "global",
                        user: learner,
                        enrollment: null,
                        originContent: null,
                        originTask: null,
                        originChallenge: null,
                        originQuiz: null,
                        originFoundation: null,
                        title: null,
                        archivedAt: null,
                    }),
            )
            course = await entityManager.save(entityManager.create(CourseEntity,
                {
                    title: "Streaming Reliability",
                    displayId: `streaming-reliability-${Date.now()}`,
                    description: "Operational AI streaming fixture.",
                    originalPrice: 1_000_000,
                    defaultLocale: Locale.En,
                }))
            const enrollment = await entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user: learner,
                        course,
                        isEnrolled: true,
                        pricingPhase: PricingPhase.Regular,
                    }),
            )
            interviewSession = await entityManager.save(
                entityManager.create(MockInterviewSessionEntity,
                    {
                        enrollment,
                        promptId: "streaming-system-design",
                        promptTitle: "Design a reliable event pipeline",
                        level: "senior",
                        lang: null,
                        difficulty: "hard",
                        source: "classic",
                        mode: "design",
                        seedQuestions: null,
                        countsToReadiness: true,
                        status: "in_progress",
                        turns: null,
                        questionIndex: 0,
                        phaseIndex: 0,
                        name: null,
                    }),
            )
        })

        afterAll(async () => {
            for (const socket of sockets) {
                socket.disconnect()
            }
            streamSpy.mockRestore()
            clearRuntimeAppConfig()
            await app?.close().catch(() => undefined)
            await redisCache?.disconnect().catch(() => undefined)
            redis?.disconnect()
            rmSync(keysDirectory,
                {
                    recursive: true,
                    force: true,
                })
        })

        it("falls back when the first provider fails before its first chunk",
            async () => {
                streamScript.set([
                    {
                        error: transientProviderError("local unavailable"),
                    },
                    {
                        chunks: [
                            {
                                text: "The idempotency key ",
                            },
                            {
                                text: "deduplicates retries.",
                                promptTokens: 100,
                                completionTokens: 20,
                            },
                        ],
                    },
                ])

                const messages = await askContent("before-first")

                expect(messages.map((message) => message.data.delta).join(""))
                    .toBe("The idempotency key deduplicates retries.")
                expect(messages.at(-1)?.data.done).toBe(true)
                expect(messages.at(-1)?.data.error).toBeUndefined()
                expect(streamSpy).toHaveBeenCalledTimes(2)
                expect(await entityManager.find(CreditUsageHistoryEntity)).toEqual([
                    expect.objectContaining({
                        model: "e2e-stream-openrouter",
                        provider: ModelProvider.OpenRouter,
                        attempts: 2,
                    }),
                ])
            })

        it("discards a failed provider's partial answer before flushing the fallback",
            async () => {
                streamScript.set([
                    {
                        chunks: [
                            {
                                text: "WRONG PARTIAL A",
                            },
                        ],
                        error: transientProviderError("local stream broke"),
                    },
                    {
                        chunks: [
                            {
                                text: "COMPLETE B",
                                promptTokens: 50,
                                completionTokens: 10,
                            },
                        ],
                    },
                ])

                const messages = await askContent("after-partial")
                const answer = messages.map((message) => message.data.delta).join("")

                expect(answer).toBe("COMPLETE B")
                expect(answer).not.toContain("WRONG PARTIAL A")
                const persisted = await entityManager.find(ContentAiMessageEntity,
                    {
                        order: {
                            createdAt: "ASC",
                        },
                    })
                expect(persisted.map((message) => message.message)).toEqual([
                    "Explain why an idempotency key matters.",
                    "COMPLETE B",
                ])
                expect(await entityManager.find(CreditUsageHistoryEntity)).toEqual([
                    expect.objectContaining({
                        model: "e2e-stream-openrouter",
                        provider: ModelProvider.OpenRouter,
                        attempts: 2,
                        promptTokens: 50,
                        completionTokens: 10,
                    }),
                ])
            })

        it("aborts through the socket without fallback, charge or persisted partial text",
            async () => {
                streamScript.set([
                    {
                        chunks: [
                            {
                                text: "buffered but never emitted",
                            },
                        ],
                        waitForAbort: true,
                    },
                ])
                const socket = await connect("content_ai")
                const messagesPromise = collect(socket,
                    SubscriptionEvent.ContentAiChunk)
                socket.emit(PublicationEvent.AskContentAi,
                    {
                        locale: Locale.En,
                        data: {
                            streamId: "abort-stream",
                            sessionId: contentSession.id,
                            question: "Explain abort semantics.",
                            history: [],
                        },
                    })
                await streamScript.waitUntilAttemptStarted()

                socket.emit(PublicationEvent.AbortContentAi,
                    {
                        data: {
                            streamId: "abort-stream",
                        },
                    })
                const messages = await messagesPromise

                expect(messages.filter((message) => !message.data.done)).toEqual([])
                expect(messages.at(-1)?.data).toMatchObject({
                    done: true,
                    delta: "",
                    error: expect.stringMatching(/aborted/i),
                })
                expect(streamSpy).toHaveBeenCalledTimes(1)
                expect(await entityManager.count(CreditUsageHistoryEntity)).toBe(0)
                expect(await entityManager.count(AiSubscriptionEntity)).toBe(0)
                expect(await entityManager.count(ContentAiMessageEntity)).toBe(0)
            })

        it("returns one terminal error after every provider is exhausted without charging",
            async () => {
                streamScript.set([
                    {
                        error: transientProviderError("local unavailable"),
                    },
                    {
                        chunks: [
                            {
                                text: "discard this partial too",
                            },
                        ],
                        error: transientProviderError("cloud unavailable"),
                    },
                ])

                const messages = await askContent("all-exhausted")

                expect(messages).toHaveLength(1)
                expect(messages[0].data).toMatchObject({
                    done: true,
                    delta: "",
                    error: expect.stringMatching(/exhausted/i),
                })
                expect(streamSpy).toHaveBeenCalledTimes(2)
                expect(await entityManager.count(CreditUsageHistoryEntity)).toBe(0)
                expect(await entityManager.count(ContentAiMessageEntity)).toBe(0)
            })

        it("charges and persists one successful content turn with served-model attribution",
            async () => {
                streamScript.set([
                    {
                        chunks: [
                            {
                                text: "One complete answer.",
                                promptTokens: 100,
                                completionTokens: 20,
                                cachedTokens: 80,
                            },
                        ],
                    },
                ])

                const messages = await askContent("content-success")

                expect(messages.map((message) => message.data.delta).join(""))
                    .toBe("One complete answer.")
                expect(await entityManager.count(ContentAiMessageEntity)).toBe(2)
                expect(await entityManager.find(CreditUsageHistoryEntity)).toEqual([
                    expect.objectContaining({
                        surface: AiCeilSurface.Chatbot,
                        model: "e2e-stream-local",
                        provider: ModelProvider.Local,
                        attempts: 1,
                        promptTokens: 100,
                        completionTokens: 20,
                    }),
                ])
            })

        it("streams a real mock-interview turn and charges it exactly once",
            async () => {
                streamScript.set([
                    {
                        chunks: [
                            {
                                text: "How would you make consumer retries idempotent?",
                                promptTokens: 80,
                                completionTokens: 12,
                            },
                        ],
                    },
                ])
                const socket = await connect("mock_interview")
                const messagesPromise = collect(socket,
                    SubscriptionEvent.MockInterviewChunk)

                socket.emit(PublicationEvent.AskMockInterviewTurn,
                    {
                        locale: Locale.En,
                        data: {
                            streamId: "interview-success",
                            sessionId: interviewSession.id,
                            courseId: course.id,
                            promptId: interviewSession.promptId,
                            promptTitle: interviewSession.promptTitle,
                            phase: MockInterviewPhase.Requirements,
                            history: [],
                            latestAnswer: "",
                            level: "senior",
                            mode: "design",
                        },
                    })
                const messages = await messagesPromise

                expect(messages.map((message) => message.data.delta).join(""))
                    .toBe("How would you make consumer retries idempotent?")
                expect(await entityManager.find(CreditUsageHistoryEntity)).toEqual([
                    expect.objectContaining({
                        surface: AiCeilSurface.Interview,
                        model: "e2e-stream-local",
                        provider: ModelProvider.Local,
                        attempts: 1,
                        promptTokens: 80,
                        completionTokens: 12,
                    }),
                ])
                expect(streamSpy).toHaveBeenCalledTimes(1)
            })
    })
