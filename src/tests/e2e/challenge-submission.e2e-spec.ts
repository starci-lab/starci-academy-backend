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
import request from "supertest"
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
    EventEmitterModule,
} from "@nestjs/event-emitter"
import {
    BullModule as NestBullModule,
    getQueueToken,
} from "@nestjs/bullmq"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ChatOpenAI,
} from "@langchain/openai"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    Cache,
} from "cache-manager"
import type {
    Queue,
} from "bullmq"
import type {
    Redis as IoRedis,
} from "ioredis"
import type {
    EntityManager,
} from "typeorm"
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
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobStalledService,
} from "@modules/bussiness/jobs/atomic/job-stalled.service"
import {
    EnqueueProcessGitSubmissionJobService,
} from "@modules/bussiness/jobs/enqueue/process-git-submission.service"
import {
    EnqueueProcessGoogleDocsSubmissionJobService,
} from "@modules/bussiness/jobs/enqueue/process-google-docs-submission.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    ChallengeProgressService,
} from "@modules/bussiness/progress/challenge.service"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    ChallengeSubmissionOutcomeCriteriaEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission-outcome-criteria.entity"
import {
    ChallengeSubmissionOutcomeCriteriaLangEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission-outcome-criteria-lang.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    CreditUsageHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/credit-usage-history.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"
import {
    UserChallengeSubmissionFeedbackEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-feedback.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    XpHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/xp-history.entity"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    ChallengeDifficulty,
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    SubmissionFeedbackSeverity,
} from "@modules/databases/postgresql/primary/enums/submission-feedback-severity"
import {
    SubmissionType,
} from "@modules/databases/postgresql/primary/enums/submission-type"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    PostgreSqlAdvisoryLockService,
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
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
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    GradingRetrievalService,
} from "@modules/integrations/rag/grading-rag-retrieval.service"
import {
    QDRANT_CLIENT,
} from "@modules/databases/qdrant/constants/client"
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
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    NatsMessageFactoryService,
} from "@modules/platform/event/nats/nats-message-factory.service"
import {
    NatsProducerService,
} from "@modules/platform/event/nats/producer.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    SubmitChallengeSubmissionHandler,
} from "@features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/submit-challenge-submission.handler"
import {
    SubmitChallengeSubmissionResolver,
} from "@features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/submit-challenge-submission.resolver"
import {
    SubmitChallengeSubmissionService,
} from "@features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/submit-challenge-submission.service"
import {
    ProcessGitSubmissionWorker,
} from "@features/api/processors/ai/process-git-submission/process-git-submission.worker"
import {
    ProcessGitSubmissionStepMappingService,
} from "@features/api/processors/ai/process-git-submission/step-mapping.service"
import {
    ProcessGitSubmissionCompleteStepService,
} from "@features/api/processors/ai/process-git-submission/steps/process-git-submission-complete-step.service"
import {
    ProcessGitSubmissionGradeStepService,
} from "@features/api/processors/ai/process-git-submission/steps/process-git-submission-grade-step.service"
import {
    ChallengeEvaluationParseService,
} from "@features/api/processors/ai/shared/challenge-evaluation/challenge-evaluation-parse.service"
import {
    ChallengeEvaluationPromptService,
} from "@features/api/processors/ai/shared/challenge-evaluation/challenge-evaluation-prompt.service"
import {
    aiE2eRedisCacheManagerToken,
    AiProviderInvokeScript,
    createAiE2eRedisProviders,
} from "@tests/helpers/ai-provider-invoke-script"
import {
    until,
} from "@tests/helpers/flow-wait"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const gitQueueData = bullData[BullQueueName.ProcessGitSubmission]
const googleDocsQueueData = bullData[BullQueueName.ProcessGoogleDocsSubmission]
const sendMailQueueData = bullData[BullQueueName.SendMail]
const MODEL_NAME = "e2e-challenge-grader"
const MODEL_CREDIT = 3
const FEEDBACK = "The endpoint contract and error path are implemented correctly."

const loaderLoadMock = jest.fn()
jest.mock(
    "@langchain/community/document_loaders/web/github",
    () => ({
        GithubRepoLoader: jest.fn().mockImplementation(() => ({
            load: loaderLoadMock,
        })),
    }),
)

const passingEvaluation = JSON.stringify({
    shortFeedback: "The submitted endpoint satisfies the required contract.",
    score: 90,
    details: [
        {
            criteriaId: "endpoint-contract",
            feedbacks: [
                {
                    severity: SubmissionFeedbackSeverity.Low,
                    message: FEEDBACK,
                    location: "src/app.controller.ts:12",
                    suggestion: null,
                },
            ],
        },
    ],
})

/**
 * Operational challenge-grading proof. GraphQL creates the durable job, Redis/BullMQ
 * delivers it, and the production worker performs both grading steps. Jest replaces
 * only the GitHub, Qdrant/embedding and concrete LangChain provider network results.
 */
describe("a learner's challenge submission is graded by the durable worker",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let currentUser: UserEntity
        let course: CourseEntity
        let submission: ChallengeSubmissionEntity
        let redis: IoRedis
        let redisCache: Cache
        let gitQueue: Queue<string>
        let keysDirectory: string
        let modelKeysPath: string

        const providerScript = new AiProviderInvokeScript()
        const invokeSpy = jest.spyOn(ChatOpenAI.prototype,
            "invoke")
            .mockImplementation(() => providerScript.next() as never)
        const qdrantStoreSpy = jest.spyOn(QdrantVectorStore,
            "fromDocuments")
            .mockResolvedValue({
                similaritySearch: jest.fn().mockResolvedValue([
                    {
                        pageContent: "export class AppController { create() { return 201 } }",
                        metadata: {
                            source: "src/app.controller.ts",
                        },
                    },
                ]),
            } as never)

        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                    .req.user = currentUser
                return true
            },
        }

        const submit = async (user: UserEntity): Promise<string> => {
            currentUser = user
            const response = await request(app.getHttpServer())
                .post("/graphql")
                .set("x-course-id",
                    course.id)
                .send({
                    query: `
                        mutation Submit($request: SubmitChallengeSubmissionRequest!) {
                            submitChallengeSubmission(request: $request) {
                                data { jobId }
                            }
                        }
                    `,
                    variables: {
                        request: {
                            challengeSubmissionId: submission.id,
                            githubUrl: "https://github.com/starci/academy",
                            lang: "typescript",
                        },
                    },
                })
                .expect(200)
            expect(response.body.errors).toBeUndefined()
            return response.body.data.submitChallengeSubmission.data.jobId as string
        }

        const waitForJob = async (
            jobId: string,
            status: JobStatus,
        ): Promise<JobEntity> => {
            await until(async () => (await entityManager.findOneBy(JobEntity,
                {
                    id: jobId,
                }))?.status === status,
            {
                timeout: 15_000,
                describe: `challenge grading job ${jobId} to become ${status}`,
            })
            return entityManager.findOneByOrFail(JobEntity,
                {
                    id: jobId,
                })
        }

        const saveLearner = (key: string): Promise<UserEntity> =>
            entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: key,
                    email: `${key}@example.test`,
                    username: key,
                }))

        beforeAll(async () => {
            process.env.BULLMQ_ENQUEUE_UX_DELAY = "0ms"
            keysDirectory = mkdtempSync(join(tmpdir(),
                "starci-challenge-e2e-"))
            modelKeysPath = join(keysDirectory,
                "openai.key")
            writeFileSync(modelKeysPath,
                "e2e-challenge-key")

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
                    EventEmitterModule.forRoot(),
                    CqrsModule,
                    NestBullModule.forRoot({
                        connection: {
                            host: process.env.REDIS_BULLMQ_HOST,
                            port: Number(process.env.REDIS_BULLMQ_PORT),
                            password: process.env.REDIS_BULLMQ_PASSWORD,
                        },
                    }),
                    NestBullModule.registerQueue(
                        {
                            name: gitQueueData.name,
                            prefix: gitQueueData.prefix,
                            defaultJobOptions: {
                                attempts: 2,
                                backoff: {
                                    type: "fixed",
                                    delay: 10,
                                },
                                removeOnComplete: false,
                                removeOnFail: false,
                            },
                        },
                        {
                            name: googleDocsQueueData.name,
                            prefix: googleDocsQueueData.prefix,
                        },
                        {
                            name: sendMailQueueData.name,
                            prefix: sendMailQueueData.prefix,
                        },
                    ),
                ],
                providers: [
                    ...createAiE2eRedisProviders(),
                    createSuperJsonServiceProvider(),
                    SubmitChallengeSubmissionResolver,
                    SubmitChallengeSubmissionService,
                    SubmitChallengeSubmissionHandler,
                    GraphQLEnrollmentGuard,
                    UserService,
                    JobActionService,
                    JobStalledService,
                    EnqueueProcessGitSubmissionJobService,
                    EnqueueProcessGoogleDocsSubmissionJobService,
                    EnqueueSendMailJobService,
                    PostgreSqlAdvisoryLockService,
                    ProcessGitSubmissionWorker,
                    ProcessGitSubmissionStepMappingService,
                    ProcessGitSubmissionGradeStepService,
                    ProcessGitSubmissionCompleteStepService,
                    ChallengeEvaluationParseService,
                    ChallengeEvaluationPromptService,
                    GradingRetrievalService,
                    AiInvokeService,
                    AiEntitlementService,
                    GradingLaneValidationService,
                    AiModelCatalogService,
                    KeyStoreService,
                    KeyRotatorService,
                    AiBalancerService,
                    UseApiService,
                    AiPingCacheService,
                    AiModelLatencyCacheService,
                    CacheService,
                    DayjsService,
                    ProgressProjectionService,
                    ChallengeProgressService,
                    NotificationService,
                    UserStatsProjectionService,
                    EventEmitterService,
                    MountFilesystemService,
                    {
                        provide: MountStorageService,
                        useValue: {
                            githubAccessToken: "e2e-github-token",
                            encryptionKey: "e2e-encryption-key",
                            appConfig: {
                                systemConfig: {
                                    challenge: {
                                        passThreshold: 0.7,
                                    },
                                },
                            },
                        },
                    },
                    EncryptionService,
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: {
                            getAutoQuota: () => ({
                                creditsPer5h: 10,
                                creditsPerWeek: 20,
                            }),
                        },
                    },
                    {
                        provide: EmbeddingModelService,
                        useValue: {
                            get: () => ({
                                embedDocuments: jest.fn(),
                                embedQuery: jest.fn(),
                            }),
                        },
                    },
                    {
                        provide: QDRANT_CLIENT,
                        useValue: {
                            deleteCollection: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: NatsProducerService,
                        useValue: {
                            publish: jest.fn(),
                        },
                    },
                    {
                        provide: NatsMessageFactoryService,
                        useValue: {
                            create: jest.fn().mockReturnValue("{}"),
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(authGuard)
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
            gitQueue = app.get<Queue<string>>(getQueueToken(gitQueueData.name))

            await entityManager.query(
                "TRUNCATE TABLE ai_models, courses, users, jobs RESTART IDENTITY CASCADE",
            )
            await redis.flushdb()
            await gitQueue.drain(true)
            await entityManager.save(entityManager.create(AiModelEntity,
                {
                    name: MODEL_NAME,
                    provider: ModelProvider.OpenAI,
                    category: AiModelCategory.Medium,
                    keysFilePath: modelKeysPath,
                    priority: 100,
                    weight: 10,
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
                        AiModelTask.ChallengeGrading,
                    ],
                    defaultLocale: Locale.En,
                }))
            await app.get(AiModelCatalogService).invalidate()
            await app.get(KeyStoreService).reloadAll()

            currentUser = await saveLearner("challenge-happy")
            course = await entityManager.save(entityManager.create(CourseEntity,
                {
                    title: "Fullstack Mastery",
                    displayId: "challenge-worker-course",
                    description: "Challenge worker fixture",
                    originalPrice: 999_000,
                    defaultLocale: Locale.En,
                }))
            const module_ = await entityManager.save(entityManager.create(ModuleEntity,
                {
                    title: "NestJS",
                    displayId: "challenge-worker-module",
                    description: "Challenge worker module",
                    defaultLocale: Locale.En,
                    course,
                }))
            const content = await entityManager.save(entityManager.create(ContentEntity,
                {
                    title: "Build an endpoint",
                    displayId: "challenge-worker-content",
                    body: "",
                    defaultLocale: Locale.En,
                    isPremium: false,
                    module: module_,
                }))
            const challenge = await entityManager.save(entityManager.create(ChallengeEntity,
                {
                    title: "Ship the endpoint",
                    displayId: "challenge-worker-challenge",
                    description: "Challenge worker flow",
                    difficulty: ChallengeDifficulty.Easy,
                    defaultLocale: Locale.En,
                    content,
                }))
            submission = await entityManager.save(entityManager.create(ChallengeSubmissionEntity,
                {
                    type: SubmissionType.GithubUrl,
                    title: "Submit repository",
                    score: 100,
                    outcomeScore: 100,
                    approachScore: 0,
                    orderIndex: 0,
                    challenge,
                }))
            const criterion = await entityManager.save(entityManager.create(
                ChallengeSubmissionOutcomeCriteriaEntity,
                {
                    orderIndex: 0,
                    critical: true,
                    challengeSubmission: submission,
                },
            ))
            await entityManager.save(entityManager.create(
                ChallengeSubmissionOutcomeCriteriaLangEntity,
                {
                    lang: "typescript",
                    body: "The endpoint returns the documented success and error contracts.",
                    outcomeCriteria: criterion,
                },
            ))
            loaderLoadMock.mockResolvedValue([
                {
                    pageContent: "export class AppController { create() { return 201 } }",
                    metadata: {
                        source: "src/app.controller.ts",
                    },
                    id: "src/app.controller.ts",
                },
            ])
        })

        afterAll(async () => {
            invokeSpy.mockRestore()
            qdrantStoreSpy.mockRestore()
            await app?.close().catch(() => undefined)
            await redisCache?.disconnect()
            redis?.disconnect()
            rmSync(keysDirectory,
                {
                    recursive: true,
                    force: true,
                })
        })

        it("persists the job, attempt, feedback, reward and attributed credit charge",
            async () => {
                providerScript.set([
                    {
                        text: passingEvaluation,
                        promptTokens: 120,
                        completionTokens: 30,
                    },
                ])

                const jobId = await submit(currentUser)
                const job = await waitForJob(jobId,
                    JobStatus.Completed)
                const learnerSubmission = await entityManager.findOneOrFail(
                    UserChallengeSubmissionEntity,
                    {
                        where: {
                            user: {
                                id: currentUser.id,
                            },
                            submission: {
                                id: submission.id,
                            },
                        },
                    },
                )
                const attempt = await entityManager.findOneOrFail(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        where: {
                            idempotencyKey: jobId,
                        },
                        relations: {
                            feedbacks: true,
                        },
                    },
                )
                const ledger = await entityManager.find(CreditUsageHistoryEntity,
                    {
                        where: {
                            user: {
                                id: currentUser.id,
                            },
                        },
                    })
                const xp = await entityManager.find(XpHistoryEntity,
                    {
                        where: {
                            user: {
                                id: currentUser.id,
                            },
                            source: XpSource.Challenge,
                        },
                    })
                const reloadedUser = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: currentUser.id,
                    })

                expect(job).toMatchObject({
                    status: JobStatus.Completed,
                    currentStep: 2,
                })
                expect(learnerSubmission.id).toBe(attempt.userChallengeSubmissionId)
                expect(attempt).toMatchObject({
                    score: 90,
                    servedModel: MODEL_NAME,
                    servedProvider: ModelProvider.OpenAI,
                    promptTokens: 120,
                    completionTokens: 30,
                })
                expect(attempt.feedbacks).toEqual([
                    expect.objectContaining({
                        message: FEEDBACK,
                        severity: SubmissionFeedbackSeverity.Low,
                    }),
                ])
                expect(ledger).toEqual([
                    expect.objectContaining({
                        credits: MODEL_CREDIT,
                        model: MODEL_NAME,
                        provider: ModelProvider.OpenAI,
                        attempts: 1,
                    }),
                ])
                expect(xp).toEqual([
                    expect.objectContaining({
                        amount: 90,
                        points: 20,
                        refId: attempt.id,
                    }),
                ])
                expect(reloadedUser.coinBalance).toBe(20)
            })

        it("retries a malformed provider result without charging or rewarding twice",
            async () => {
                const retryLearner = await saveLearner("challenge-retry")
                providerScript.set([
                    {
                        text: "{ malformed-json",
                        promptTokens: 80,
                        completionTokens: 10,
                    },
                    {
                        text: passingEvaluation,
                        promptTokens: 120,
                        completionTokens: 30,
                    },
                ])
                const callsBefore = invokeSpy.mock.calls.length

                const jobId = await submit(retryLearner)
                await waitForJob(jobId,
                    JobStatus.Completed)
                const attempts = await entityManager.count(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        where: {
                            idempotencyKey: jobId,
                        },
                    },
                )
                const ledger = await entityManager.find(CreditUsageHistoryEntity,
                    {
                        where: {
                            user: {
                                id: retryLearner.id,
                            },
                        },
                    })
                const xp = await entityManager.find(XpHistoryEntity,
                    {
                        where: {
                            user: {
                                id: retryLearner.id,
                            },
                            source: XpSource.Challenge,
                        },
                    })
                const reloadedUser = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: retryLearner.id,
                    })

                expect(invokeSpy.mock.calls.length - callsBefore).toBe(2)
                expect(attempts).toBe(1)
                expect(ledger).toHaveLength(1)
                expect(ledger[0].credits).toBe(MODEL_CREDIT)
                expect(xp).toHaveLength(1)
                expect(reloadedUser.coinBalance).toBe(20)
            })

        it("fails after provider retries are exhausted without persisting or charging",
            async () => {
                const failedLearner = await saveLearner("challenge-provider-failure")
                providerScript.set([
                    Object.assign(new Error("provider unavailable"),
                        {
                            status: 503,
                        }),
                    Object.assign(new Error("provider still unavailable"),
                        {
                            status: 503,
                        }),
                ])
                const callsBefore = invokeSpy.mock.calls.length

                const jobId = await submit(failedLearner)
                await until(async () => {
                    const brokerJob = await gitQueue.getJob(jobId)
                    return brokerJob?.attemptsMade === 2
                        && await brokerJob.getState() === "failed"
                },
                {
                    timeout: 15_000,
                    describe: `challenge grading broker job ${jobId} to exhaust retries`,
                })
                const job = await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: jobId,
                    })
                const attempts = await entityManager.count(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        where: {
                            idempotencyKey: jobId,
                        },
                    },
                )
                const feedbacks = await entityManager.count(
                    UserChallengeSubmissionFeedbackEntity,
                    {
                        where: {
                            attempt: {
                                idempotencyKey: jobId,
                            },
                        },
                    },
                )
                const ledger = await entityManager.count(CreditUsageHistoryEntity,
                    {
                        where: {
                            user: {
                                id: failedLearner.id,
                            },
                        },
                    })
                const xp = await entityManager.count(XpHistoryEntity,
                    {
                        where: {
                            user: {
                                id: failedLearner.id,
                            },
                            source: XpSource.Challenge,
                        },
                    })

                expect(job.error).toContain("fallback models exhausted")
                expect(invokeSpy.mock.calls.length - callsBefore).toBe(1)
                expect(attempts).toBe(0)
                expect(feedbacks).toBe(0)
                expect(ledger).toBe(0)
                expect(xp).toBe(0)
            })

        it("rejects an exhausted learner before enqueue and leaves no grading consequences",
            async () => {
                const exhaustedLearner = await saveLearner("challenge-exhausted")
                const now = new Date()
                await entityManager.save(entityManager.create(AiSubscriptionEntity,
                    {
                        user: exhaustedLearner,
                        credit5hUsed: 1_000_000,
                        creditWeekUsed: 1_000_000,
                        window5hResetAt: new Date(now.getTime() + 60_000),
                        windowWeekResetAt: new Date(now.getTime() + 60_000),
                    }))
                currentUser = exhaustedLearner
                const callsBefore = invokeSpy.mock.calls.length

                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .set("x-course-id",
                        course.id)
                    .send({
                        query: `
                            mutation Submit($request: SubmitChallengeSubmissionRequest!) {
                                submitChallengeSubmission(request: $request) {
                                    success
                                    error
                                    data { jobId }
                                }
                            }
                        `,
                        variables: {
                            request: {
                                challengeSubmissionId: submission.id,
                                githubUrl: "https://github.com/starci/exhausted",
                                lang: "typescript",
                            },
                        },
                    })
                    .expect(200)
                const jobs = await entityManager.count(JobEntity,
                    {
                        where: {
                            userId: exhaustedLearner.id,
                        },
                    })
                const attempts = await entityManager.count(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        where: {
                            userChallengeSubmission: {
                                user: {
                                    id: exhaustedLearner.id,
                                },
                            },
                        },
                    },
                )
                const ledger = await entityManager.count(CreditUsageHistoryEntity,
                    {
                        where: {
                            user: {
                                id: exhaustedLearner.id,
                            },
                        },
                    })

                expect(response.body.data.submitChallengeSubmission).toMatchObject({
                    success: false,
                    data: null,
                })
                expect(invokeSpy.mock.calls.length).toBe(callsBefore)
                expect(jobs).toBe(0)
                expect(attempts).toBe(0)
                expect(ledger).toBe(0)
            })
    })
