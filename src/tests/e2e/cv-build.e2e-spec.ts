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
    BullModule,
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
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
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
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobStalledService,
} from "@modules/bussiness/jobs/atomic/job-stalled.service"
import {
    CvEvidenceService,
} from "@modules/bussiness/cv-evidence/cv-evidence.service"
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
    CreditUsageHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/credit-usage-history.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
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
    CvGenerationStatus,
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    CvSource,
} from "@modules/databases/postgresql/primary/enums/cv-source"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
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
    QDRANT_CLIENT,
} from "@modules/databases/qdrant/constants/client"
import {
    CvRagRetrievalService,
} from "@modules/integrations/rag/cv-rag-retrieval.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    S3UploadService,
} from "@modules/integrations/s3/s3-upload.service"
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
    GenerateCvHandler,
} from "@features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.handler"
import {
    GenerateCvResolver,
} from "@features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.resolver"
import {
    GenerateCvService,
} from "@features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.service"
import {
    UploadCvHandler,
} from "@features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.handler"
import {
    UploadCvResolver,
} from "@features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.resolver"
import {
    UploadCvService,
} from "@features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.service"
import {
    ReviseCvHandler,
} from "@features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.handler"
import {
    ReviseCvResolver,
} from "@features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.resolver"
import {
    ReviseCvService,
} from "@features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.service"
import {
    MyCvGenerationsHandler,
} from "@features/api/core/graphql/queries/cv-submissions/my-cv-generations/my-cv-generations.handler"
import {
    MyCvGenerationsResolver,
} from "@features/api/core/graphql/queries/cv-submissions/my-cv-generations/my-cv-generations.resolver"
import {
    MyCvGenerationsService,
} from "@features/api/core/graphql/queries/cv-submissions/my-cv-generations/my-cv-generations.service"
import {
    MyPickableCvAchievementsHandler,
} from "@features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/my-pickable-cv-achievements.handler"
import {
    MyPickableCvAchievementsResolver,
} from "@features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/my-pickable-cv-achievements.resolver"
import {
    MyPickableCvAchievementsService,
} from "@features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/my-pickable-cv-achievements.service"
import {
    EnqueueGenerateCvJobService,
} from "@features/api/processors/ai/generate-cv/enqueue-generate-cv.service"
import {
    GenerateCvWorker,
} from "@features/api/processors/ai/generate-cv/generate-cv.worker"
import {
    GenerateCvStepMappingService,
} from "@features/api/processors/ai/generate-cv/step-mapping.service"
import {
    GenerateCvCompleteStepService,
} from "@features/api/processors/ai/generate-cv/steps/generate-cv-complete-step.service"
import {
    GenerateCvComposeStepService,
} from "@features/api/processors/ai/generate-cv/steps/generate-cv-compose-step.service"
import {
    GenerateCvGatherStepService,
} from "@features/api/processors/ai/generate-cv/steps/generate-cv-gather-step.service"
import {
    GenerateCvRenderStepService,
} from "@features/api/processors/ai/generate-cv/steps/generate-cv-render-step.service"
import {
    GenerateCvScoreStepService,
} from "@features/api/processors/ai/generate-cv/steps/generate-cv-score-step.service"
import {
    EnqueueScoreUploadedCvJobService,
} from "@features/api/processors/ai/score-uploaded-cv/enqueue-score-uploaded-cv.service"
import {
    ScoreUploadedCvWorker,
} from "@features/api/processors/ai/score-uploaded-cv/score-uploaded-cv.worker"
import {
    CvScoringService,
} from "@features/api/processors/ai/shared/cv-scoring/cv-scoring.service"
import {
    CvScoringPromptService,
} from "@features/api/processors/ai/shared/cv-scoring/cv-scoring-prompt.service"
import {
    ScoreUploadedCvService,
} from "@features/api/processors/ai/shared/cv-scoring/score-uploaded-cv.service"
import {
    compileCvPdf,
} from "@features/api/processors/ai/generate-cv/steps/compile-cv-pdf"
import {
    extractCvText,
} from "@features/api/processors/ai/generate-cv/steps/extract-cv-text"
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

jest.mock("@features/api/processors/ai/generate-cv/steps/compile-cv-pdf",
    () => ({
        compileCvPdf: jest.fn(),
    }))
jest.mock("@features/api/processors/ai/generate-cv/steps/extract-cv-text",
    () => ({
        extractCvText: jest.fn(),
    }))

const generateQueueName = "generate-cv"
const scoreQueueData = bullData[BullQueueName.ScoreUploadedCv]
const modelName = "e2e-cv-model"
const composedCv = JSON.stringify({
    fullName: "Ada Learner",
    headline: "Backend Engineer",
    summary: "Builds reliable distributed systems.",
    skillGroups: [
        {
            category: "Backend",
            items: [
                "TypeScript",
                "PostgreSQL",
            ],
        },
    ],
    experiences: [
        {
            title: "Engineer",
            org: "StarCI",
            location: "Remote",
            dateRange: "2024-present",
            bullets: ["Reduced queue failures by 40%."],
        },
    ],
    education: [
        {
            school: "Academy",
            degree: "Software Engineering",
            dateRange: "2023-2024",
        },
    ],
})
const scoredCv = JSON.stringify({
    shortFeedback: "Strong evidence and a clear structure.",
    score: 88,
    items: [
        {
            severity: "low",
            section: "impact",
            message: "Impact is quantified.",
            suggestion: null,
        },
    ],
})

/**
 * CV operational proof: GraphQL creates durable state, real Redis/BullMQ dispatches
 * it, and production workers own every state transition. Only provider I/O, S3,
 * document extraction and PDF compilation are deterministic Jest boundaries.
 *
 * CV AI is intentionally unbilled in the current product contract: both compose
 * and score route through AiInvokeService but neither calls entitlement.consume.
 * Every successful case therefore asserts that no quota or ledger row is created.
 */
describe("a learner builds a CV through the durable worker pipeline",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let redis: IoRedis
        let redisCache: Cache
        let generateQueue: Queue<string>
        let scoreQueue: Queue<string>
        let currentUser: UserEntity
        let keysDirectory: string

        const providerScript = new AiProviderInvokeScript()
        const invokeSpy = jest.spyOn(ChatOpenAI.prototype,
            "invoke")
            .mockImplementation(() => providerScript.next() as never)
        const qdrantSpy = jest.spyOn(QdrantVectorStore,
            "fromExistingCollection")
            .mockResolvedValue({
                similaritySearch: jest.fn().mockResolvedValue([]),
            } as never)
        const compileMock = jest.mocked(compileCvPdf)
        const extractMock = jest.mocked(extractCvText)
        const s3ReadMock = {
            buffer: jest.fn().mockResolvedValue(Buffer.from("uploaded pdf")),
        }
        const s3UploadMock = {
            buffer: jest.fn().mockResolvedValue(undefined),
        }

        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                    .req.user = currentUser
                return true
            },
        }

        const invokeMutation = async (
            name: "generateCv" | "uploadCv",
            input: Record<string, unknown>,
        ): Promise<{ jobId: string, cvGenerationId: string }> => {
            const response = await request(app.getHttpServer())
                .post("/graphql")
                .send({
                    query: `
                        mutation Run($request: ${name === "generateCv"
        ? "GenerateCvRequest"
        : "UploadCvRequest"}!) {
                            ${name}(request: $request) {
                                success
                                error
                                data { jobId cvGenerationId }
                            }
                        }
                    `,
                    variables: {
                        request: {
                            targetLevel: CvTargetLevel.Mid,
                            ...(name === "generateCv" ? {
                                milestoneTaskAttemptIds: [],
                            } : {
                            }),
                            ...input,
                        },
                    },
                })
                .expect(200)
            expect(response.body.errors).toBeUndefined()
            expect(response.body.data[name].success).toBe(true)
            return response.body.data[name].data
        }

        const reviseCv = async (
            sourceId: string,
        ): Promise<{ jobId: string, cvGenerationId: string }> => {
            const response = await request(app.getHttpServer())
                .post("/graphql")
                .send({
                    query: `
                        mutation Revise($request: ReviseCvRequest!) {
                            reviseCv(request: $request) {
                                success
                                error
                                data { jobId cvGenerationId }
                            }
                        }
                    `,
                    variables: {
                        request: {
                            cvSubmissionId: sourceId,
                            extraPrompts: "Preserve facts and improve impact.",
                        },
                    },
                })
                .expect(200)
            expect(response.body.errors).toBeUndefined()
            expect(response.body.data.reviseCv.success).toBe(true)
            return response.body.data.reviseCv.data
        }

        const waitFor = async (
            jobId: string,
            cvGenerationId: string,
            status: JobStatus,
        ): Promise<{ job: JobEntity, cv: UserCvGenerationEntity }> => {
            await until(async () => (await entityManager.findOneBy(JobEntity,
                {
                    id: jobId,
                }))?.status === status,
            {
                timeout: 20_000,
                describe: `CV job ${jobId} to become ${status}`,
            })
            const job = await entityManager.findOneByOrFail(JobEntity,
                {
                    id: jobId,
                })
            return {
                job,
                cv: await entityManager.findOneByOrFail(UserCvGenerationEntity,
                    {
                        id: cvGenerationId,
                    }),
            }
        }

        const expectUnbilled = async (): Promise<void> => {
            expect(await entityManager.count(CreditUsageHistoryEntity)).toBe(0)
            expect(await entityManager.count(AiSubscriptionEntity)).toBe(0)
        }

        beforeAll(async () => {
            process.env.BULLMQ_ENQUEUE_UX_DELAY = "0ms"
            keysDirectory = mkdtempSync(join(tmpdir(),
                "starci-cv-e2e-"))
            const keysPath = join(keysDirectory,
                "openai.key")
            writeFileSync(keysPath,
                "e2e-cv-key")

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
                    BullModule.forRoot({
                        connection: {
                            host: process.env.REDIS_BULLMQ_HOST,
                            port: Number(process.env.REDIS_BULLMQ_PORT),
                            password: process.env.REDIS_BULLMQ_PASSWORD,
                        },
                    }),
                    BullModule.registerQueue(
                        {
                            name: generateQueueName,
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
                            name: scoreQueueData.name,
                            prefix: scoreQueueData.prefix,
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
                    ),
                ],
                providers: [
                    ...createAiE2eRedisProviders(),
                    createSuperJsonServiceProvider(),
                    GenerateCvResolver,
                    GenerateCvService,
                    GenerateCvHandler,
                    UploadCvResolver,
                    UploadCvService,
                    UploadCvHandler,
                    ReviseCvResolver,
                    ReviseCvService,
                    ReviseCvHandler,
                    MyCvGenerationsResolver,
                    MyCvGenerationsService,
                    MyCvGenerationsHandler,
                    MyPickableCvAchievementsResolver,
                    MyPickableCvAchievementsService,
                    MyPickableCvAchievementsHandler,
                    CvEvidenceService,
                    EnqueueGenerateCvJobService,
                    EnqueueScoreUploadedCvJobService,
                    GenerateCvWorker,
                    ScoreUploadedCvWorker,
                    GenerateCvStepMappingService,
                    GenerateCvGatherStepService,
                    GenerateCvComposeStepService,
                    GenerateCvRenderStepService,
                    GenerateCvScoreStepService,
                    GenerateCvCompleteStepService,
                    CvScoringService,
                    CvScoringPromptService,
                    ScoreUploadedCvService,
                    CvRagRetrievalService,
                    JobActionService,
                    JobStalledService,
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
                    MountFilesystemService,
                    {
                        provide: MountStorageService,
                        useValue: {
                            appConfig: {
                                systemConfig: {
                                },
                            },
                        },
                    },
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: {
                            getAutoQuota: () => ({
                                creditsPer5h: 100,
                                creditsPerWeek: 200,
                            }),
                        },
                    },
                    {
                        provide: EmbeddingModelService,
                        useValue: {
                            getViaBalancer: jest.fn().mockResolvedValue({
                                embedDocuments: jest.fn(),
                                embedQuery: jest.fn(),
                            }),
                        },
                    },
                    {
                        provide: QDRANT_CLIENT,
                        useValue: {
                        },
                    },
                    {
                        provide: S3ReadService,
                        useValue: s3ReadMock,
                    },
                    {
                        provide: S3UploadService,
                        useValue: s3UploadMock,
                    },
                    EventEmitterService,
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
            redis = app.get<IoRedis>(createIoRedisKey(IoRedisInstanceKey.Cache))
            redisCache = app.get<Cache>(aiE2eRedisCacheManagerToken)
            generateQueue = app.get<Queue<string>>(getQueueToken(generateQueueName))
            scoreQueue = app.get<Queue<string>>(getQueueToken(scoreQueueData.name))

            await entityManager.save(entityManager.create(AiModelEntity,
                {
                    name: modelName,
                    provider: ModelProvider.OpenAI,
                    category: AiModelCategory.Medium,
                    keysFilePath: keysPath,
                    priority: 100,
                    weight: 10,
                    credit: 5,
                    priceInUsdPerMTok: 0,
                    priceOutUsdPerMTok: 0,
                    priceCacheReadUsdPerMTok: null,
                    creditPerMTokIn: 0,
                    creditPerMTokOut: 0,
                    creditPerMTokCached: null,
                    contextWindowTokens: 128_000,
                    enabled: true,
                    complimentary: false,
                    supportedTasks: [AiModelTask.CVGenerating],
                    defaultLocale: Locale.En,
                }))
            await app.get(AiModelCatalogService).invalidate()
            await app.get(KeyStoreService).reloadAll()
        })

        beforeEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE cv_generations, credit_usage_histories, ai_subscriptions, jobs, users RESTART IDENTITY CASCADE",
            )
            await redis.flushdb()
            await generateQueue.drain(true)
            await scoreQueue.drain(true)
            providerScript.set([])
            invokeSpy.mockClear()
            qdrantSpy.mockClear()
            compileMock.mockReset().mockResolvedValue(Buffer.from("pdf"))
            extractMock.mockReset().mockResolvedValue("Ada builds reliable APIs.")
            s3ReadMock.buffer.mockClear().mockResolvedValue(Buffer.from("uploaded pdf"))
            s3UploadMock.buffer.mockClear().mockResolvedValue(undefined)
            currentUser = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `cv-${crypto.randomUUID()}`,
                    email: "ada@example.test",
                    username: `ada-${crypto.randomUUID()}`,
                    displayName: "Ada Learner",
                }))
        })

        afterAll(async () => {
            invokeSpy.mockRestore()
            qdrantSpy.mockRestore()
            await redisCache.disconnect().catch(() => undefined)
            redis.disconnect()
            await app.close().catch(() => undefined)
            rmSync(keysDirectory,
                {
                    recursive: true,
                    force: true,
                })
        })

        it("moves a generated CV from Pending to Done with structured data and artifacts",
            async () => {
                providerScript.set([
                    {
                        text: composedCv,
                    },
                    {
                        text: scoredCv,
                    },
                ])
                const started = await invokeMutation("generateCv",
                    {
                        extraPrompts: "Emphasize backend reliability.",
                    })
                const { job, cv } = await waitFor(started.jobId,
                    started.cvGenerationId,
                    JobStatus.Completed)

                expect(cv.status).toBe(CvGenerationStatus.Done)
                expect(cv.structuredData).toMatchObject({
                    fullName: "Ada Learner",
                })
                expect(cv.score).toBe(88)
                expect(cv.targetLevel).toBe(CvTargetLevel.Mid)
                expect(cv.selectedEvidence).toEqual([])
                expect(cv.latexCdnKey).toContain(started.jobId)
                expect(cv.generatedPdfCdnKey).toContain(started.jobId)
                expect(job.currentStep).toBe(job.maxSteps)
                expect(s3UploadMock.buffer).toHaveBeenCalledTimes(2)

                const history = await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            query History {
                                myCvGenerations {
                                    success
                                    data { id targetLevel selectedEvidenceCount evidenceLevel score }
                                }
                            }
                        `,
                    })
                    .expect(200)
                expect(history.body.errors).toBeUndefined()
                expect(history.body.data.myCvGenerations.data[0]).toEqual(expect.objectContaining({
                    id: started.cvGenerationId,
                    targetLevel: CvTargetLevel.Mid,
                    selectedEvidenceCount: 0,
                    evidenceLevel: "self_reported",
                    score: 88,
                }))

                const picker = await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            query Picker {
                                myPickableCvAchievements {
                                    success
                                    data { milestoneTaskAttempts { id courseId taskTitle } }
                                }
                            }
                        `,
                    })
                    .expect(200)
                expect(picker.body.errors).toBeUndefined()
                expect(picker.body.data.myPickableCvAchievements.data.milestoneTaskAttempts).toEqual([])
                await expectUnbilled()
            })

        it("scores an uploaded CV through its real single-step worker",
            async () => {
                providerScript.set([
                    {
                        text: scoredCv,
                    },
                ])
                const started = await invokeMutation("uploadCv",
                    {
                        cdnKey: `users/${currentUser.id}/resume.pdf`,
                        label: "Uploaded CV",
                    })
                const { cv } = await waitFor(started.jobId,
                    started.cvGenerationId,
                    JobStatus.Completed)

                expect(cv.status).toBe(CvGenerationStatus.Done)
                expect(cv.score).toBe(88)
                expect(cv.feedback).toMatchObject({
                    shortFeedback: "Strong evidence and a clear structure.",
                })
                expect(extractMock).toHaveBeenCalledTimes(1)
                await expectUnbilled()
            })

        it("revises an owned uploaded CV through the same durable five-step pipeline",
            async () => {
                const source = await entityManager.save(entityManager.create(
                    UserCvGenerationEntity,
                    {
                        user: {
                            id: currentUser.id,
                        },
                        mode: CvGenerationMode.Generate,
                        source: CvSource.Uploaded,
                        status: CvGenerationStatus.Done,
                        uploadedCdnKey: `users/${currentUser.id}/source.pdf`,
                        language: Locale.En,
                        targetLevel: CvTargetLevel.Senior,
                        selectedEvidence: [],
                    },
                ))
                providerScript.set([
                    {
                        text: composedCv,
                    },
                    {
                        text: scoredCv,
                    },
                ])
                const started = await reviseCv(source.id)
                const { cv } = await waitFor(started.jobId,
                    started.cvGenerationId,
                    JobStatus.Completed)

                expect(cv.status).toBe(CvGenerationStatus.Done)
                expect(cv.mode).toBe(CvGenerationMode.Revise)
                expect(cv.sourceCvSubmissionId).toBe(source.id)
                expect(cv.targetLevel).toBe(CvTargetLevel.Senior)
                expect(cv.selectedEvidence).toEqual([])
                expect(await entityManager.count(UserCvGenerationEntity)).toBe(2)
                expect(extractMock).toHaveBeenCalledTimes(1)
                await expectUnbilled()
            })

        it("marks compose exhaustion Failed without publishing partial artifacts",
            async () => {
                providerScript.set([
                    new Error("compose provider unavailable"),
                    new Error("compose provider unavailable"),
                ])
                const started = await invokeMutation("generateCv",
                    {
                        extraPrompts: "Generate a concise CV.",
                    })
                const { cv } = await waitFor(started.jobId,
                    started.cvGenerationId,
                    JobStatus.Failed)

                expect(cv.status).toBe(CvGenerationStatus.Failed)
                expect(cv.structuredData).toBeNull()
                expect(cv.latexCdnKey).toBeNull()
                expect(cv.generatedPdfCdnKey).toBeNull()
                expect(s3UploadMock.buffer).not.toHaveBeenCalled()
                await expectUnbilled()
            })

        it("keeps the generated artifact Done when advisory scoring fails",
            async () => {
                providerScript.set([
                    {
                        text: composedCv,
                    },
                    new SyntaxError("invalid score JSON"),
                ])
                const started = await invokeMutation("generateCv",
                    {
                        extraPrompts: "Generate then score.",
                    })
                const { cv } = await waitFor(started.jobId,
                    started.cvGenerationId,
                    JobStatus.Completed)

                expect(cv.status).toBe(CvGenerationStatus.Done)
                expect(cv.structuredData).not.toBeNull()
                expect(cv.latexCdnKey).not.toBeNull()
                expect(cv.score).toBeNull()
                expect(cv.feedback).toBeNull()
                await expectUnbilled()
            })

        it("resumes a failed compose step on BullMQ retry without duplicating the row or artifacts",
            async () => {
                providerScript.set([
                    {
                        text: "not-json",
                    },
                    {
                        text: composedCv,
                    },
                    {
                        text: scoredCv,
                    },
                ])
                const started = await invokeMutation("generateCv",
                    {
                        extraPrompts: "Retry safely.",
                    })
                const { cv } = await waitFor(started.jobId,
                    started.cvGenerationId,
                    JobStatus.Completed)

                expect(cv.status).toBe(CvGenerationStatus.Done)
                expect(await entityManager.count(UserCvGenerationEntity)).toBe(1)
                expect(s3UploadMock.buffer).toHaveBeenCalledTimes(2)
                expect(invokeSpy).toHaveBeenCalledTimes(3)
                await expectUnbilled()
            })

        it("closes jobs and generations when either real queue client rejects enqueue",
            async () => {
                await generateQueue.close()
                const generated = await invokeMutation("generateCv",
                    {
                        extraPrompts: "Broker failure.",
                    })
                const { cv: generatedCv } = await waitFor(generated.jobId,
                    generated.cvGenerationId,
                    JobStatus.Failed)
                await scoreQueue.close()
                const uploaded = await invokeMutation("uploadCv",
                    {
                        cdnKey: `users/${currentUser.id}/unreachable.pdf`,
                    })
                const { cv: uploadedCv } = await waitFor(uploaded.jobId,
                    uploaded.cvGenerationId,
                    JobStatus.Failed)

                expect(generatedCv.status).toBe(CvGenerationStatus.Failed)
                expect(generatedCv.errorMessage).toContain("Failed to enqueue job to broker")
                expect(uploadedCv.status).toBe(CvGenerationStatus.Failed)
                expect(uploadedCv.errorMessage).toContain("Failed to enqueue job to broker")
                expect(invokeSpy).not.toHaveBeenCalled()
                await expectUnbilled()
            })
    })
