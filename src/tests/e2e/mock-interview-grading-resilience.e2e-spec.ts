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
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
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
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
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
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    CreditUsageHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/credit-usage-history.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MockInterviewAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-attempt.entity"
import {
    MockInterviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
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
    MockInterviewMode,
} from "@modules/databases/postgresql/primary/enums/mock-interview-mode"
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
    QDRANT_CLIENT,
} from "@modules/databases/qdrant/constants/client"
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
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
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
    GradeMockInterviewSessionHandler,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session.handler"
import {
    MockInterviewGradingService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-grading.service"
import {
    MockInterviewGradePromptService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-prompt.service"
import {
    GradeMockInterviewSessionResolver,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session.resolver"
import {
    GradeMockInterviewSessionService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session.service"
import {
    AiProviderInvokeScript,
    aiE2eRedisCacheManagerToken,
    createAiE2eRedisProviders,
} from "@tests/helpers/ai-provider-invoke-script"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const MODEL_NAME = "e2e-mock-interview-grader"
const MODEL_CREDIT = 4
const GRADE_MUTATION = `
    mutation Grade($request: GradeMockInterviewSessionRequest!) {
        gradeMockInterviewSession(request: $request) {
            success
            error
            data {
                overallScore
                verdict
                strengths
                gaps
                followUpQuestion
                phaseScores { phase score max }
                attributeScores { key score }
            }
        }
    }
`

const gradeResult = JSON.stringify({
    overallScore: 82,
    verdict: "pass",
    phaseScores: [
        {
            phase: "Question 1",
            score: 82,
            max: 100,
        },
    ],
    attributeScores: [
        {
            key: "communication",
            score: 84,
        },
    ],
    strengths: [
        "Explained delivery guarantees and idempotency boundaries.",
    ],
    gaps: [
        "Quantify the retry budget.",
    ],
    followUpQuestion: "How is poison-message recovery bounded?",
    questionFeedback: [],
})

/** GraphQL grade input shared by retries of one persisted interview session. */
interface GradeRequestInput {
    courseId: string
    promptId: string
    promptTitle: string
    level: string
    sessionId: string
    turns: Array<{
        role: string
        phase: MockInterviewPhase
        content: string
        questionIndex: number
    }>
}

/** Transport response shape needed by the operational grade assertions. */
interface GradeTransportData {
    gradeMockInterviewSession: {
        success: boolean
        error: string | null
        data: {
            overallScore: number
            verdict: string
            strengths: Array<string>
            gaps: Array<string>
            followUpQuestion: string | null
        } | null
    }
}

/**
 * Operational proof that mock-interview grading is a durable idempotent
 * business operation, not merely an HTTP request that happened to return 200.
 * GraphQL, CQRS, grading/parser, AI routing/key rotation, Redis, entitlement
 * and Postgres are production implementations. Only the external LangChain
 * provider result is scripted.
 */
describe("mock-interview grading replay preserves one durable grade",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let redis: IoRedis
        let redisCache: Cache
        let learner: UserEntity
        let course: CourseEntity
        let enrollment: EnrollmentEntity
        let keysDirectory: string
        let keyStore: KeyStoreService
        let catalog: AiModelCatalogService
        const providerScript = new AiProviderInvokeScript()
        const invokeSpy = jest.spyOn(ChatOpenAI.prototype,
            "invoke")
            .mockImplementation(() => providerScript.next() as never)

        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = learner
                return true
            },
        }

        const grade = async (input: GradeRequestInput) => request(app.getHttpServer())
            .post("/graphql")
            .set("authorization",
                "Bearer mock-interview-grading-e2e")
            .set("x-course-id",
                course.id)
            .send({
                query: GRADE_MUTATION,
                variables: {
                    request: input,
                },
            })

        const createSession = async (): Promise<GradeRequestInput> => {
            const session = await entityManager.save(
                entityManager.create(MockInterviewSessionEntity,
                    {
                        enrollment,
                        promptId: "server-owned-prompt",
                        promptTitle: "Reliable notification delivery",
                        level: "middle",
                        lang: null,
                        difficulty: "medium",
                        source: "classic",
                        mode: MockInterviewMode.Qna,
                        seedQuestions: [],
                        countsToReadiness: true,
                        status: "in_progress",
                        turns: null,
                        questionIndex: 0,
                        phaseIndex: 0,
                        name: "Operational replay round",
                    }),
            )
            return {
                courseId: course.id,
                promptId: "client-cannot-replace-prompt",
                promptTitle: "Client supplied title",
                level: "junior",
                sessionId: session.id,
                turns: [
                    {
                        role: "interviewer",
                        phase: MockInterviewPhase.Requirements,
                        questionIndex: 0,
                        content: "How would you make notification delivery reliable?",
                    },
                    {
                        role: "candidate",
                        phase: MockInterviewPhase.Requirements,
                        questionIndex: 0,
                        content: "I would use a durable queue, idempotency keys, bounded retries, dead-letter recovery, delivery receipts, and metrics that distinguish accepted work from confirmed delivery across every channel.",
                    },
                ],
            }
        }

        const expectSuccessfulGrade = (response: request.Response): GradeTransportData => {
            expect(response.status).toBe(200)
            expect(response.body.errors).toBeUndefined()
            const data = response.body.data as GradeTransportData
            expect(data.gradeMockInterviewSession).toMatchObject({
                success: true,
                error: null,
                data: {
                    overallScore: 82,
                    verdict: "pass",
                    strengths: [
                        "Explained delivery guarantees and idempotency boundaries.",
                    ],
                    gaps: [
                        "Quantify the retry budget.",
                    ],
                    followUpQuestion: "How is poison-message recovery bounded?",
                },
            })
            return data
        }

        const expectSingleDurableConsequence = async (sessionId: string): Promise<void> => {
            const attempts = await entityManager.findBy(MockInterviewAttemptEntity,
                {
                    sessionId,
                })
            expect(attempts).toHaveLength(1)
            expect(attempts[0]).toMatchObject({
                promptId: "server-owned-prompt",
                promptTitle: "Reliable notification delivery",
                overallScore: 82,
                verdict: "pass",
                name: "Operational replay round",
            })
            const ledger = await entityManager.findBy(CreditUsageHistoryEntity,
                {
                    user: {
                        id: learner.id,
                    },
                })
            expect(ledger).toHaveLength(1)
            expect(ledger[0]).toMatchObject({
                model: MODEL_NAME,
                provider: ModelProvider.OpenAI,
                task: AiModelTask.Grading,
                credits: MODEL_CREDIT,
                attempts: 1,
            })
            const subscription = await entityManager.findOneOrFail(
                AiSubscriptionEntity,
                {
                    where: {
                        user: {
                            id: learner.id,
                        },
                    },
                },
            )
            expect(subscription.credit5hUsed).toBe(MODEL_CREDIT)
            expect(subscription.creditWeekUsed).toBe(MODEL_CREDIT)
            const session = await entityManager.findOneByOrFail(
                MockInterviewSessionEntity,
                {
                    id: sessionId,
                },
            )
            expect(session.status).toBe("completed")
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
                "starci-mock-interview-grade-"))
            const keysFilePath = join(keysDirectory,
                "openai.key")
            writeFileSync(keysFilePath,
                "e2e-mock-interview-key")

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
                    GradeMockInterviewSessionResolver,
                    GradeMockInterviewSessionService,
                    GradeMockInterviewSessionHandler,
                    MockInterviewGradingService,
                    MockInterviewGradePromptService,
                    UserService,
                    AiInvokeService,
                    AiEntitlementService,
                    GradingLaneValidationService,
                    AiAutoQuotaConfigService,
                    AiModelCatalogService,
                    KeyStoreService,
                    KeyRotatorService,
                    AiBalancerService,
                    UseApiService,
                    AiPingCacheService,
                    AiModelLatencyCacheService,
                    DayjsService,
                    GraphQLMustEnrolledGuard,
                    EmbeddingModelService,
                    CourseRagRetrievalService,
                    {
                        provide: QDRANT_CLIENT,
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
            catalog = app.get(AiModelCatalogService)

            await entityManager.query(`
                TRUNCATE TABLE mock_interview_attempts, mock_interview_sessions,
                credit_usage_histories, ai_subscriptions, enrollments, users,
                courses, ai_models RESTART IDENTITY CASCADE
            `)
            await redis.flushdb()
            await entityManager.save(
                entityManager.create(AiModelEntity,
                    {
                        name: MODEL_NAME,
                        provider: ModelProvider.OpenAI,
                        category: AiModelCategory.Medium,
                        keysFilePath,
                        priority: 100,
                        weight: 100,
                        credit: MODEL_CREDIT,
                        priceInUsdPerMTok: 0,
                        priceOutUsdPerMTok: 0,
                        priceCacheReadUsdPerMTok: null,
                        creditPerMTokIn: 0,
                        creditPerMTokOut: 0,
                        creditPerMTokCached: null,
                        contextWindowTokens: 128_000,
                        enabled: true,
                        complimentary: false,
                        supportedTasks: [
                            AiModelTask.Grading,
                        ],
                        defaultLocale: Locale.En,
                    }),
            )
            await catalog.invalidate()
            await keyStore.reloadAll()
            learner = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-mock-interview-grading-resilience",
                        email: "mock-interview-grading@starci.test",
                        username: "mock-interview-grading-learner",
                    }),
            )
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Operational Mock Interview",
                        displayId: "operational-mock-interview",
                        description: "Mock-interview grading resilience fixture.",
                        originalPrice: 1_000_000,
                        defaultLocale: Locale.En,
                    }),
            )
            enrollment = await entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user: learner,
                        course,
                        isEnrolled: true,
                        pricingPhase: PricingPhase.Regular,
                    }),
            )
        })

        beforeEach(async () => {
            await entityManager.query(`
                TRUNCATE TABLE mock_interview_attempts, mock_interview_sessions,
                credit_usage_histories, ai_subscriptions RESTART IDENTITY CASCADE
            `)
            invokeSpy.mockClear()
            providerScript.set([
                {
                    text: gradeResult,
                },
            ])
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

        it("persists one trusted grade, one charge and one terminal session",
            async () => {
                const input = await createSession()
                const response = await grade(input)

                expectSuccessfulGrade(response)
                expect(invokeSpy).toHaveBeenCalledTimes(1)
                await expectSingleDurableConsequence(input.sessionId)
            })

        it("replays the durable result without invoking or charging the model again",
            async () => {
                const input = await createSession()
                const first = await grade(input)
                expectSuccessfulGrade(first)
                const replay = await grade({
                    ...input,
                    promptId: "tampered-on-replay",
                    promptTitle: "Tampered replay title",
                })

                expectSuccessfulGrade(replay)
                expect(invokeSpy).toHaveBeenCalledTimes(1)
                await expectSingleDurableConsequence(input.sessionId)
            })

        it("serializes concurrent duplicate grades into one model call and one consequence",
            async () => {
                const input = await createSession()
                const pending = [
                    grade(input),
                    grade(input),
                ]
                const responses = await Promise.all(pending)

                responses.forEach(expectSuccessfulGrade)
                expect(invokeSpy).toHaveBeenCalledTimes(1)
                await expectSingleDurableConsequence(input.sessionId)
            })
    })
