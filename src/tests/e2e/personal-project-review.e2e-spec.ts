// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handlers pull `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle (same guard as
// review-personal-project-task.handler.spec.ts).
import "@modules/bussiness/bussiness.module"
import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
    CanActivate,
    ExecutionContext,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakJwksService,
} from "@modules/integrations/keycloak/jwks.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    UrlValidatorService,
} from "@modules/lib/validators/url.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    EnqueueReviewPersonalProjectTaskJobService,
} from "@modules/bussiness/jobs/enqueue/review-personal-project-task.service"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    SubmitPersonalGithubUrlResolver,
} from "@features/api/core/graphql/mutations/personal-project/submit-personal-github-url/submit-personal-github-url.resolver"
import {
    SubmitPersonalGithubUrlService,
} from "@features/api/core/graphql/mutations/personal-project/submit-personal-github-url/submit-personal-github-url.service"
import {
    SubmitPersonalGithubUrlHandler,
} from "@features/api/core/graphql/mutations/personal-project/submit-personal-github-url/submit-personal-github-url.handler"
import {
    SyncPersonalProjectGithubResolver,
} from "@features/api/core/graphql/mutations/personal-project/sync-personal-project-github/sync-personal-project-github.resolver"
import {
    SyncPersonalProjectGithubService,
} from "@features/api/core/graphql/mutations/personal-project/sync-personal-project-github/sync-personal-project-github.service"
import {
    SyncPersonalProjectGithubHandler,
} from "@features/api/core/graphql/mutations/personal-project/sync-personal-project-github/sync-personal-project-github.handler"
import {
    ReviewPersonalProjectTaskResolver,
} from "@features/api/core/graphql/mutations/personal-project/review-personal-project-task/review-personal-project-task.resolver"
import {
    ReviewPersonalProjectTaskService,
} from "@features/api/core/graphql/mutations/personal-project/review-personal-project-task/review-personal-project-task.service"
import {
    ReviewPersonalProjectTaskHandler,
} from "@features/api/core/graphql/mutations/personal-project/review-personal-project-task/review-personal-project-task.handler"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
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
import {
    EventEmitterModule,
} from "@nestjs/event-emitter"
import {
    BullModule as NestBullModule,
    getQueueToken,
} from "@nestjs/bullmq"
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
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobStalledService,
} from "@modules/bussiness/jobs/atomic/job-stalled.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    POSTGRESQL_PRIMARY as PRIMARY_CONNECTION,
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
    MilestoneTaskCriteriaEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task-criteria.entity"
import {
    UserMilestoneTaskAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-milestone-task-attempt.entity"
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
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    MilestoneSeverity,
} from "@modules/databases/postgresql/primary/enums/milestone-severity"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    PostgreSqlAdvisoryLockService,
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
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
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
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
    ReviewMilestoneTaskWorker,
} from "@features/api/processors/ai/review-milestone-task/review-milestone-task.worker"
import {
    ReviewMilestoneTaskStepMappingService,
} from "@features/api/processors/ai/review-milestone-task/step-mapping.service"
import {
    ReviewMilestoneTaskCompleteStepService,
} from "@features/api/processors/ai/review-milestone-task/steps/review-milestone-task-complete-step.service"
import {
    ReviewMilestoneTaskGradeStepService,
} from "@features/api/processors/ai/review-milestone-task/steps/review-milestone-task-grade-step.service"
import {
    ReviewMilestoneTaskCreditService,
} from "@features/api/processors/ai/review-milestone-task/review-milestone-task-credit.service"
import {
    ProjectEvaluationParseService,
} from "@features/api/processors/ai/shared/project-evaluation/project-evaluation-parse.service"
import {
    aiE2eRedisCacheManagerToken,
    AiProviderInvokeScript,
    createAiE2eRedisProviders,
} from "@tests/helpers/ai-provider-invoke-script"
import {
    until,
} from "@tests/helpers/flow-wait"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

const reviewQueueData = bullData[BullQueueName.ReviewPersonalProjectTask]
const reviewSendMailQueueData = bullData[BullQueueName.SendMail]
const REVIEW_MODEL = "e2e-personal-project-grader"
const REVIEW_MODEL_CREDIT = 3
const REVIEW_FEEDBACK = "The implementation satisfies the task contract."

const reviewGithubLoadMock = jest.fn()
jest.mock(
    "@langchain/community/document_loaders/web/github",
    () => ({
        GithubRepoLoader: jest.fn().mockImplementation(() => ({
            load: reviewGithubLoadMock,
        })),
    }),
)

const reviewEvaluation = (
    score: number,
): string => JSON.stringify({
    shortFeedback: score >= 70
        ? "The personal project satisfies the milestone."
        : "The personal project needs another iteration.",
    score,
    details: [
        {
            feedbacks: [
                {
                    severity: MilestoneSeverity.Low,
                    message: REVIEW_FEEDBACK,
                    location: "src/project.ts:8",
                    suggestion: score >= 70 ? null : "Complete the missing branch.",
                },
            ],
        },
    ],
})

/** Params for the `EncryptionService.encrypt` mock. */
interface EncryptionServiceEncryptParams {
    plainText: string
}

/**
 * e2e for the three personal-project mutations -- `.claude` task brief
 * "personal-project mutations (submit / sync-personal-project-github /
 * review-personal-project-task)": none of the three had e2e coverage before
 * this file (their `.handler.spec.ts` siblings all mock the `EntityManager`).
 * Runs the real `GraphQLMustEnrolledGuard` (-> real `UserService.checkEnrollment`
 * SQL against real `enrollments` rows), the real handlers' validation branches,
 * and real Postgres writes on `EnrollmentEntity` -- not a mocked DB.
 *
 * MOCKED (genuinely external to the process, or out of scope for this spec):
 *  - `EncryptionService` -- real class does AES-256-GCM keyed off a mounted
 *    encryption key this harness doesn't have; stubbed to a deterministic
 *    encrypt so the stored ciphertext/last4 can still be asserted.
 *  - `GradingLaneValidationService` -- real class resolves a pinned AI
 *    model/provider against the `ai_models` catalog; this spec's mutations
 *    never inspect its result besides feeding it into the enqueue payload, so
 *    it is stubbed to "no pin" (matches `review-personal-project-task.handler.spec.ts`).
 *  - `EnqueueReviewPersonalProjectTaskJobService` -- the BullMQ boundary; the
 *    actual AI grading + GitHub fetch happen in a separate worker
 *    (`ReviewMilestoneTaskWorker`) that is out of scope here (per
 *    `.artifacts/states/progress` research: no queue/worker is exercised by
 *    the mutation itself). Stubbed to hand back a fixed job id.
 *  - `KeycloakAuthGraphQLGuard` -- no Keycloak server in this harness;
 *    overridden to stamp `request.user` with whichever fake user the test
 *    "logs in" as (same pattern as `content-ai-entitlement.e2e-spec.ts`).
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring, the three
 * CQRS handlers under test, `GraphQLMustEnrolledGuard` + `UserService`
 * (`checkEnrollment` runs real SQL -- `CacheService` is stubbed to always miss
 * so it never short-circuits to a stale in-memory set), and `UrlValidatorService`
 * (no external deps, safe to use as-is).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("a learner submits a personal project and receives a durable review",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guard stamps onto the request. */
        let currentUser: UserEntity | null = null

        /** Overrides the real Keycloak JWT verification -- no Keycloak server here. */
        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!currentUser) {
                    return false
                }
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return true
            },
        }

        /** Fixture ids shared by every test (seeded once -- read-only material). */
        let course: CourseEntity
        /** A second course with NO milestone tasks -- for the "no tasks" branch. */
        let courseNoTasks: CourseEntity
        let task: MilestoneTaskEntity

        const enqueueReviewJobMock = {
            enqueue: jest.fn().mockResolvedValue({
                id: "job-e2e-1",
            }),
        }
        const gradingLaneValidationServiceMock = {
            validate: jest.fn().mockResolvedValue({
                gradingModel: null,
                gradingProvider: null,
            }),
        }
        const encryptionServiceMock = {
            encrypt: jest.fn(({ plainText }: EncryptionServiceEncryptParams) => ({
                iv: "iv-mock",
                authTag: "authtag-mock",
                ciphertext: `ct-${plainText}`,
            })),
            decrypt: jest.fn(),
        }
        // CacheService always misses -> UserService.checkEnrollment hits real
        // Postgres every time (no stale cross-test cache to reason about).
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const SUBMIT_MUTATION = `
            mutation Submit($request: SubmitPersonalGithubUrlRequest!) {
                submitPersonalGithubUrl(request: $request) {
                    success
                    message
                    error
                    data {
                        id
                        personalProjectGithubUrl
                    }
                }
            }
        `
        const SYNC_MUTATION = `
            mutation Sync($request: SyncPersonalProjectGithubRequest!) {
                syncPersonalProjectGithub(request: $request) {
                    success
                    message
                    error
                }
            }
        `
        const REVIEW_MUTATION = `
            mutation Review($request: ReviewPersonalProjectTaskRequest!) {
                reviewPersonalProjectTask(request: $request) {
                    success
                    message
                    error
                    data {
                        jobId
                    }
                }
            }
        `

        /** POST a GraphQL mutation, optionally with an `x-course-id` header. */
        const post = (
            query: string,
            input: Record<string, unknown>,
            courseId?: string,
        ) => {
            const req = request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables: {
                        request: input,
                    },
                })
            if (courseId) {
                req.set("x-course-id",
                    courseId)
            }
            return req
        }

        beforeAll(async () => {
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
                    // CommandBus + @CommandHandler discovery for the 3 handlers
                    CqrsModule,
                ],
                providers: [
                    // satisfies the GraphQL "Query root type must be provided"
                    // rule -- this module registers only mutation resolvers
                    SubmitPersonalGithubUrlResolver,
                    SubmitPersonalGithubUrlService,
                    SubmitPersonalGithubUrlHandler,
                    SyncPersonalProjectGithubResolver,
                    SyncPersonalProjectGithubService,
                    SyncPersonalProjectGithubHandler,
                    ReviewPersonalProjectTaskResolver,
                    ReviewPersonalProjectTaskService,
                    ReviewPersonalProjectTaskHandler,
                    // REAL -- the enrollment gate under test, resolved lazily by
                    // @UseGuards() from this module's own provider graph
                    GraphQLMustEnrolledGuard,
                    // REAL -- checkEnrollment runs real SQL against real `enrollments`
                    UserService,
                    // REAL -- no external deps, just `new URL(...)`
                    UrlValidatorService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: EncryptionService,
                        useValue: encryptionServiceMock,
                    },
                    {
                        provide: GradingLaneValidationService,
                        useValue: gradingLaneValidationServiceMock,
                    },
                    {
                        provide: EnqueueReviewPersonalProjectTaskJobService,
                        useValue: enqueueReviewJobMock,
                    },
                    // KeycloakAuthGraphQLGuard deps -- let Nest construct the real
                    // guard at compile time; `.overrideGuard` swaps its runtime
                    // behaviour below (same pattern as content-progress.e2e-spec.ts)
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
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

            // seed the read-only course/milestone/task fixtures ONCE -- only
            // `users`/`enrollments` are reset between tests (see afterEach)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-pp-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const milestone = await entityManager.save(
                entityManager.create(MilestoneEntity,
                    {
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            task = await entityManager.save(
                entityManager.create(MilestoneTaskEntity,
                    {
                        defaultLocale: Locale.En,
                        maxScore: 100,
                        sortIndex: 0,
                        milestone,
                    }),
            )

            courseNoTasks = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Course With No Tasks",
                        displayId: "course-no-tasks-pp-e2e",
                        description: "e2e fixture course with zero milestone tasks",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // reset per-test user/enrollment state; course/milestone/task fixtures
            // (seeded in beforeAll) are read-only across the whole suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
            gradingLaneValidationServiceMock.validate.mockResolvedValue({
                gradingModel: null,
                gradingProvider: null,
            })
            enqueueReviewJobMock.enqueue.mockResolvedValue({
                id: "job-e2e-1",
            })
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        /** Seed a REAL, active (`is_enrolled = true`) enrollment for (user, targetCourse). */
        const seedEnrollment = async (
            user: UserEntity,
            overrides: Partial<EnrollmentEntity> = {
            },
            targetCourse: CourseEntity = course,
        ): Promise<EnrollmentEntity> =>
            entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user,
                        course: targetCourse,
                        pricingPhase: PricingPhase.Regular,
                        isEnrolled: true,
                        ...overrides,
                    }),
            )

        describe("submitPersonalGithubUrl",
            () => {
                it("enrolled learner → 200 + the enrollment's github url is written for real",
                    async () => {
                        currentUser = await seedUser("kc-submit-enrolled")
                        await seedEnrollment(currentUser)

                        const response = await post(SUBMIT_MUTATION,
                            {
                                courseId: course.id,
                                githubUrl: "https://github.com/starci/personal-project",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.submitPersonalGithubUrl
                        expect(body.success).toBe(true)
                        expect(body.data.personalProjectGithubUrl).toBe(
                            "https://github.com/starci/personal-project",
                        )

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubUrl).toBe(
                            "https://github.com/starci/personal-project",
                        )
                    })

                it("caller with NO enrollment row → BLOCKED by GraphQLMustEnrolledGuard, nothing written",
                    async () => {
                        currentUser = await seedUser("kc-submit-no-enrollment")
                        // no enrollment row at all for `course`

                        const response = await post(SUBMIT_MUTATION,
                            {
                                courseId: course.id,
                                githubUrl: "https://github.com/starci/personal-project",
                            },
                            course.id)

                        // The enrollment gate is a GUARD (GraphQLMustEnrolledGuard), and
                        // guards run BEFORE interceptors -- so its thrown exception never
                        // reaches GraphQLTransformInterceptor's `catchError` (which is what
                        // produces the `{success:false, error}` body). Instead it surfaces
                        // through Apollo's `formatError`: a GraphQL transport error carrying
                        // `extensions.code`, with the HTTP status set from the exception's
                        // `httpStatus` (EnrollmentNotFoundException leaves it unset -> 500).
                        // The FE keys off `extensions.code`, not the interceptor shape, for
                        // guard-gated operations.
                        expect(response.status).toBe(500)
                        expect(response.body.data).toBeNull()
                        expect(response.body.errors[0].extensions.code)
                            .toBe("ENROLLMENT_NOT_FOUND_EXCEPTION")
                    })

                it("missing x-course-id header → CourseIdRequiredException, guard trips before the handler",
                    async () => {
                        currentUser = await seedUser("kc-submit-no-course-header")
                        await seedEnrollment(currentUser)

                        // deliberately NOT passing the course header this time
                        const response = await post(SUBMIT_MUTATION,
                            {
                                courseId: course.id,
                                githubUrl: "https://github.com/starci/personal-project",
                            })

                        // Same guard-before-interceptor path as the no-enrollment case:
                        // CourseIdRequiredException is thrown by GraphQLMustEnrolledGuard and
                        // surfaces via Apollo `formatError` as a GraphQL error, not the
                        // interceptor's `{success:false}` body. This exception DOES set
                        // `httpStatus` (400 BAD_REQUEST), so the transport status is 400.
                        expect(response.status).toBe(400)
                        expect(response.body.data).toBeNull()
                        expect(response.body.errors[0].extensions.code)
                            .toBe("COURSE_ID_REQUIRED_EXCEPTION")
                    })
            })

        describe("syncPersonalProjectGithub",
            () => {
                it("enrolled learner → url + branch upserted for real onto the enrollment row",
                    async () => {
                        currentUser = await seedUser("kc-sync-url-branch")
                        await seedEnrollment(currentUser)

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                githubUrl: "https://github.com/starci/pp-sync",
                                branch: "feature/milestone-1",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        expect(response.body.data.syncPersonalProjectGithub.success).toBe(true)

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubUrl).toBe("https://github.com/starci/pp-sync")
                        expect(reloaded.personalProjectGithubBranch).toBe("feature/milestone-1")
                    })

                it("private-repo token → encrypted at rest, only last4 is ever readable back",
                    async () => {
                        currentUser = await seedUser("kc-sync-token")
                        await seedEnrollment(currentUser)

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                githubToken: "ghp_SUPERSECRETTOKEN1234",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        expect(response.body.data.syncPersonalProjectGithub.success).toBe(true)

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        // the mocked encryption's deterministic shape -- proves the real
                        // handler round-tripped through EncryptionService.encrypt and
                        // persisted its JSON-stringified payload verbatim
                        expect(reloaded.personalProjectGithubTokenEncrypted).toBe(
                            JSON.stringify({
                                iv: "iv-mock",
                                authTag: "authtag-mock",
                                ciphertext: "ct-ghp_SUPERSECRETTOKEN1234",
                            }),
                        )
                        // masked hint only -- the plaintext is never stored/returned
                        expect(reloaded.personalProjectGithubTokenLast4).toBe("1234")
                    })

                it("clearGithubToken → nulls both the encrypted token and its last4 hint",
                    async () => {
                        currentUser = await seedUser("kc-sync-clear-token")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubTokenEncrypted: JSON.stringify({
                                    iv: "old",
                                    authTag: "old",
                                    ciphertext: "old",
                                }),
                                personalProjectGithubTokenLast4: "9999",
                            })

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                clearGithubToken: true,
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        expect(response.body.data.syncPersonalProjectGithub.success).toBe(true)

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubTokenEncrypted).toBeNull()
                        expect(reloaded.personalProjectGithubTokenLast4).toBeNull()
                    })

                it("no field at all → PersonalProjectGithubSyncInputMissingException, no write",
                    async () => {
                        currentUser = await seedUser("kc-sync-empty")
                        await seedEnrollment(currentUser)

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.syncPersonalProjectGithub
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_GITHUB_SYNC_INPUT_MISSING_EXCEPTION")
                    })

                it("branch-only update with no url ever stored → PersonalProjectGithubUrlMissingException",
                    async () => {
                        currentUser = await seedUser("kc-sync-branch-only")
                        await seedEnrollment(currentUser)
                        // no personalProjectGithubUrl on the enrollment at all

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                branch: "main",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.syncPersonalProjectGithub
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_GITHUB_URL_MISSING_EXCEPTION")
                    })

                it("branch with disallowed characters → PersonalProjectInvalidBranchNameException, no write",
                    async () => {
                        currentUser = await seedUser("kc-sync-bad-branch")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/existing",
                            })

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                branch: "bad branch name!",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.syncPersonalProjectGithub
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_INVALID_BRANCH_NAME_EXCEPTION")

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        // rejected before the transaction commits -- branch never written
                        expect(reloaded.personalProjectGithubBranch).toBeNull()
                    })

                it("branch longer than 255 chars → PersonalProjectBranchTooLongException",
                    async () => {
                        currentUser = await seedUser("kc-sync-long-branch")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/existing",
                            })

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                branch: "a".repeat(256),
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.syncPersonalProjectGithub
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_BRANCH_TOO_LONG_EXCEPTION")
                    })
            })

        describe("reviewPersonalProjectTask",
            () => {
                it("no taskId given → defaults to the first milestone task, enqueues with the stored url/branch",
                    async () => {
                        currentUser = await seedUser("kc-review-default-task")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/stored-repo",
                                personalProjectGithubBranch: "main",
                            })

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: course.id,
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(true)
                        expect(body.data.jobId).toBe("job-e2e-1")

                        expect(enqueueReviewJobMock.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                taskId: task.id,
                                userId: currentUser.id,
                                githubUrl: "https://github.com/starci/stored-repo",
                                branch: "main",
                            }),
                        )
                        // enrollment untouched -- request supplied neither url nor branch
                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubUrl).toBe("https://github.com/starci/stored-repo")
                    })

                it("request supplies its own url/branch → they win AND get persisted back onto the enrollment",
                    async () => {
                        currentUser = await seedUser("kc-review-request-overrides")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/stale-repo",
                                personalProjectGithubBranch: "old-branch",
                            })

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: course.id,
                                taskId: task.id,
                                githubUrl: "https://github.com/starci/fresh-repo",
                                branch: "fresh-branch",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(true)

                        expect(enqueueReviewJobMock.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                taskId: task.id,
                                githubUrl: "https://github.com/starci/fresh-repo",
                                branch: "fresh-branch",
                            }),
                        )

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubUrl).toBe("https://github.com/starci/fresh-repo")
                        expect(reloaded.personalProjectGithubBranch).toBe("fresh-branch")
                    })

                it("no url anywhere (stored or request) → PersonalProjectGithubUrlMissingException, never enqueued",
                    async () => {
                        currentUser = await seedUser("kc-review-no-url")
                        await seedEnrollment(currentUser)
                        // no personalProjectGithubUrl stored, none in the request either

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: course.id,
                                taskId: task.id,
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_GITHUB_URL_MISSING_EXCEPTION")
                        expect(enqueueReviewJobMock.enqueue).not.toHaveBeenCalled()
                    })

                it("malformed branch in the request → PersonalProjectInvalidBranchNameException, never enqueued",
                    async () => {
                        currentUser = await seedUser("kc-review-bad-branch")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/stored-repo",
                            })

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: course.id,
                                taskId: task.id,
                                branch: "not a valid branch!",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_INVALID_BRANCH_NAME_EXCEPTION")
                        expect(enqueueReviewJobMock.enqueue).not.toHaveBeenCalled()
                    })

                it("course has zero milestone tasks and no taskId given → NoPersonalProjectTasksFoundException",
                    async () => {
                        currentUser = await seedUser("kc-review-no-tasks")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/stored-repo",
                            },
                            courseNoTasks)

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: courseNoTasks.id,
                            },
                            courseNoTasks.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("NO_PERSONAL_PROJECT_TASKS_FOUND_EXCEPTION")
                        expect(enqueueReviewJobMock.enqueue).not.toHaveBeenCalled()
                    })
            })
    })

/**
 * Operational half of the flow: GraphQL persists the durable job, Redis/BullMQ
 * delivers it, and the production two-step worker grades and completes it. Jest
 * replaces only GitHub, vector retrieval and the concrete model network result.
 */
describe("a learner's personal project is reviewed by the durable worker",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let currentUser: UserEntity
        let course: CourseEntity
        let task: MilestoneTaskEntity
        let redis: IoRedis
        let redisCache: Cache
        let reviewQueue: Queue<string>
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
                        pageContent: "export const project = { complete: true }",
                        metadata: {
                            source: "src/project.ts",
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

        const saveLearner = async (
            key: string,
        ): Promise<UserEntity> => {
            const user = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: key,
                    email: `${key}@example.test`,
                    username: key,
                }))
            await entityManager.save(entityManager.create(EnrollmentEntity,
                {
                    user,
                    course,
                    pricingPhase: PricingPhase.Regular,
                    isEnrolled: true,
                    personalProjectGithubUrl: "https://github.com/starci/project",
                    personalProjectGithubBranch: "main",
                }))
            return user
        }

        const submitReview = async (
            user: UserEntity,
        ): Promise<string> => {
            currentUser = user
            const response = await request(app.getHttpServer())
                .post("/graphql")
                .set("x-course-id",
                    course.id)
                .send({
                    query: `
                        mutation Review($request: ReviewPersonalProjectTaskRequest!) {
                            reviewPersonalProjectTask(request: $request) {
                                data { jobId }
                            }
                        }
                    `,
                    variables: {
                        request: {
                            courseId: course.id,
                            taskId: task.id,
                            lang: "typescript",
                        },
                    },
                })
                .expect(200)
            expect(response.body.errors).toBeUndefined()
            return response.body.data.reviewPersonalProjectTask.data.jobId as string
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
                describe: `personal-project job ${jobId} to become ${status}`,
            })
            return entityManager.findOneByOrFail(JobEntity,
                {
                    id: jobId,
                })
        }

        const consequencesFor = async (
            user: UserEntity,
            jobId: string,
        ) => {
            const attempts = await entityManager.find(UserMilestoneTaskAttemptEntity,
                {
                    where: {
                        idempotencyKey: jobId,
                    },
                    relations: {
                        feedbacks: true,
                    },
                })
            const ledger = await entityManager.find(CreditUsageHistoryEntity,
                {
                    where: {
                        user: {
                            id: user.id,
                        },
                    },
                })
            const xp = await entityManager.find(XpHistoryEntity,
                {
                    where: {
                        user: {
                            id: user.id,
                        },
                        source: XpSource.Milestone,
                    },
                })
            const reloadedUser = await entityManager.findOneByOrFail(UserEntity,
                {
                    id: user.id,
                })
            return {
                attempts,
                ledger,
                xp,
                reloadedUser,
            }
        }

        beforeAll(async () => {
            process.env.BULLMQ_ENQUEUE_UX_DELAY = "0ms"
            keysDirectory = mkdtempSync(join(tmpdir(),
                "starci-personal-project-e2e-"))
            modelKeysPath = join(keysDirectory,
                "openai.key")
            writeFileSync(modelKeysPath,
                "e2e-personal-project-key")

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
                            name: reviewQueueData.name,
                            prefix: reviewQueueData.prefix,
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
                            name: reviewSendMailQueueData.name,
                            prefix: reviewSendMailQueueData.prefix,
                        },
                    ),
                ],
                providers: [
                    ...createAiE2eRedisProviders(),
                    createSuperJsonServiceProvider(),
                    ReviewPersonalProjectTaskResolver,
                    ReviewPersonalProjectTaskService,
                    ReviewPersonalProjectTaskHandler,
                    GraphQLMustEnrolledGuard,
                    UserService,
                    UrlValidatorService,
                    JobActionService,
                    JobStalledService,
                    EnqueueReviewPersonalProjectTaskJobService,
                    EnqueueSendMailJobService,
                    PostgreSqlAdvisoryLockService,
                    ReviewMilestoneTaskWorker,
                    ReviewMilestoneTaskStepMappingService,
                    ReviewMilestoneTaskGradeStepService,
                    ReviewMilestoneTaskCompleteStepService,
                    ReviewMilestoneTaskCreditService,
                    ProjectEvaluationParseService,
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
                    UserStatsProjectionService,
                    NotificationService,
                    EventEmitterService,
                    MountFilesystemService,
                    EncryptionService,
                    {
                        provide: MountStorageService,
                        useValue: {
                            githubAccessToken: "e2e-github-token",
                            encryptionKey: "e2e-encryption-key",
                            appConfig: {
                                systemConfig: {
                                    task: {
                                        passThreshold: 0.7,
                                    },
                                },
                            },
                        },
                    },
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
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
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
                getEntityManagerToken(PRIMARY_CONNECTION),
            )
            redis = app.get<IoRedis>(
                createIoRedisKey(IoRedisInstanceKey.Cache),
            )
            redisCache = app.get<Cache>(aiE2eRedisCacheManagerToken)
            reviewQueue = app.get<Queue<string>>(getQueueToken(reviewQueueData.name))

            await entityManager.query(
                "TRUNCATE TABLE ai_models, courses, users, jobs RESTART IDENTITY CASCADE",
            )
            await redis.flushdb()
            await reviewQueue.drain(true)
            await entityManager.save(entityManager.create(AiModelEntity,
                {
                    name: REVIEW_MODEL,
                    provider: ModelProvider.OpenAI,
                    category: AiModelCategory.Medium,
                    keysFilePath: modelKeysPath,
                    priority: 100,
                    weight: 10,
                    credit: REVIEW_MODEL_CREDIT,
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
                        AiModelTask.TaskGrading,
                    ],
                    defaultLocale: Locale.En,
                }))
            await app.get(AiModelCatalogService).invalidate()
            await app.get(KeyStoreService).reloadAll()

            course = await entityManager.save(entityManager.create(CourseEntity,
                {
                    title: "Operational Personal Project",
                    displayId: "personal-project-worker-course",
                    description: "Personal-project worker fixture",
                    originalPrice: 999_000,
                    defaultLocale: Locale.En,
                }))
            const milestone = await entityManager.save(entityManager.create(MilestoneEntity,
                {
                    defaultLocale: Locale.En,
                    course,
                }))
            task = await entityManager.save(entityManager.create(MilestoneTaskEntity,
                {
                    title: "Build the production project",
                    displayId: "personal-project-worker-task",
                    description: "Ship a complete implementation",
                    maxScore: 100,
                    sortIndex: 0,
                    milestone,
                    defaultLocale: Locale.En,
                }))
            await entityManager.save(entityManager.create(MilestoneTaskCriteriaEntity,
                {
                    text: "The implementation satisfies the contract.",
                    promptText: "Verify the production behavior and failure path.",
                    score: 100,
                    orderIndex: 0,
                    milestoneTask: task,
                    defaultLocale: Locale.En,
                }))
            reviewGithubLoadMock.mockResolvedValue([
                {
                    pageContent: "export const project = { complete: true }",
                    metadata: {
                        source: "src/project.ts",
                    },
                    id: "src/project.ts",
                },
            ])
            currentUser = await saveLearner("personal-project-happy")
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

        it("persists a passed attempt, feedback, attribution, one debit and one reward",
            async () => {
                providerScript.set([
                    {
                        text: reviewEvaluation(90),
                        promptTokens: 120,
                        completionTokens: 30,
                    },
                ])

                const jobId = await submitReview(currentUser)
                const job = await waitForJob(jobId,
                    JobStatus.Completed)
                const consequences = await consequencesFor(currentUser,
                    jobId)

                expect(job).toMatchObject({
                    status: JobStatus.Completed,
                    currentStep: 2,
                })
                expect(consequences.attempts).toHaveLength(1)
                expect(consequences.attempts[0]).toMatchObject({
                    score: 90,
                    passed: true,
                    servedModel: REVIEW_MODEL,
                    servedProvider: ModelProvider.OpenAI,
                    promptTokens: 120,
                    completionTokens: 30,
                })
                expect(consequences.attempts[0].feedbacks).toEqual([
                    expect.objectContaining({
                        message: REVIEW_FEEDBACK,
                        severity: MilestoneSeverity.Low,
                    }),
                ])
                expect(consequences.ledger).toEqual([
                    expect.objectContaining({
                        credits: REVIEW_MODEL_CREDIT,
                        model: REVIEW_MODEL,
                        provider: ModelProvider.OpenAI,
                        attempts: 1,
                    }),
                ])
                expect(consequences.xp).toEqual([
                    expect.objectContaining({
                        amount: 10,
                        points: 30,
                    }),
                ])
                expect(consequences.reloadedUser.coinBalance).toBe(30)
            })

        it("persists a failed review and charge without granting a reward",
            async () => {
                const learner = await saveLearner("personal-project-failed")
                providerScript.set([
                    {
                        text: reviewEvaluation(40),
                        promptTokens: 90,
                        completionTokens: 20,
                    },
                ])

                const jobId = await submitReview(learner)
                await waitForJob(jobId,
                    JobStatus.Completed)
                const consequences = await consequencesFor(learner,
                    jobId)

                expect(consequences.attempts).toHaveLength(1)
                expect(consequences.attempts[0]).toMatchObject({
                    score: 40,
                    passed: false,
                    servedModel: REVIEW_MODEL,
                    servedProvider: ModelProvider.OpenAI,
                })
                expect(consequences.ledger).toHaveLength(1)
                expect(consequences.ledger[0].credits).toBe(REVIEW_MODEL_CREDIT)
                expect(consequences.xp).toHaveLength(0)
                expect(consequences.reloadedUser.coinBalance).toBe(0)
            })

        it("rolls back an attempt when debit fails, then retries with one charge and reward",
            async () => {
                const learner = await saveLearner("personal-project-debit-retry")
                providerScript.set([
                    {
                        text: reviewEvaluation(90),
                        promptTokens: 110,
                        completionTokens: 25,
                    },
                ])
                const creditService = app.get(ReviewMilestoneTaskCreditService)
                const consumeSpy = jest.spyOn(creditService,
                    "consume")
                    .mockRejectedValueOnce(new Error("injected debit failure after attempt write"))
                const modelCallsBefore = invokeSpy.mock.calls.length

                const jobId = await submitReview(learner)
                await waitForJob(jobId,
                    JobStatus.Completed)
                const consequences = await consequencesFor(learner,
                    jobId)
                const brokerJob = await reviewQueue.getJob(jobId)

                expect(modelCallsBefore + 1).toBe(invokeSpy.mock.calls.length)
                expect(consumeSpy).toHaveBeenCalledTimes(2)
                expect(brokerJob?.attemptsMade).toBeGreaterThanOrEqual(1)
                expect(consequences.attempts).toHaveLength(1)
                expect(consequences.ledger).toHaveLength(1)
                expect(consequences.ledger[0].credits).toBe(REVIEW_MODEL_CREDIT)
                expect(consequences.xp).toHaveLength(1)
                expect(consequences.reloadedUser.coinBalance).toBe(30)
                consumeSpy.mockRestore()
            })

        it("stops an exhausted learner before model execution and leaves no consequence",
            async () => {
                const learner = await saveLearner("personal-project-exhausted")
                const now = new Date()
                await entityManager.save(entityManager.create(AiSubscriptionEntity,
                    {
                        user: learner,
                        credit5hUsed: 1_000_000,
                        creditWeekUsed: 1_000_000,
                        window5hResetAt: new Date(now.getTime() + 60_000),
                        windowWeekResetAt: new Date(now.getTime() + 60_000),
                    }))
                const modelCallsBefore = invokeSpy.mock.calls.length

                const jobId = await submitReview(learner)
                await until(async () => {
                    const brokerJob = await reviewQueue.getJob(jobId)
                    return brokerJob?.attemptsMade === 2
                        && await brokerJob.getState() === "failed"
                },
                {
                    timeout: 15_000,
                    describe: `personal-project job ${jobId} to exhaust quota retries`,
                })
                const consequences = await consequencesFor(learner,
                    jobId)

                expect(invokeSpy.mock.calls.length).toBe(modelCallsBefore)
                expect(consequences.attempts).toHaveLength(0)
                expect(consequences.ledger).toHaveLength(0)
                expect(consequences.xp).toHaveLength(0)
                expect(consequences.reloadedUser.coinBalance).toBe(0)
            })
    })
