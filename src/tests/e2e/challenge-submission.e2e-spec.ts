import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
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
    getQueueToken,
} from "@nestjs/bullmq"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    Queue,
} from "bullmq"
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
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    EnqueueProcessGitSubmissionJobService,
} from "@modules/bussiness/jobs/enqueue/process-git-submission.service"
import {
    EnqueueProcessGoogleDocsSubmissionJobService,
} from "@modules/bussiness/jobs/enqueue/process-google-docs-submission.service"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobStalledService,
} from "@modules/bussiness/jobs/atomic/job-stalled.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
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
    SubmissionType,
} from "@modules/databases/postgresql/primary/enums/submission-type"
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
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    UrlValidatorService,
} from "@modules/lib/validators/url.service"
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
    SubmitChallengeSubmissionHandler,
} from "@features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/submit-challenge-submission.handler"
import {
    SubmitChallengeSubmissionResolver,
} from "@features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/submit-challenge-submission.resolver"
import {
    SubmitChallengeSubmissionService,
} from "@features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/submit-challenge-submission.service"
import {
    SyncSubmissionHandler,
} from "@features/api/core/graphql/mutations/challenge-submissions/sync-submission/sync-submission.handler"
import {
    SyncSubmissionResolver,
} from "@features/api/core/graphql/mutations/challenge-submissions/sync-submission/sync-submission.resolver"
import {
    SyncSubmissionService,
} from "@features/api/core/graphql/mutations/challenge-submissions/sync-submission/sync-submission.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
import {
    until,
} from "@tests/helpers/flow-wait"

const POSTGRESQL_PRIMARY = "primary"
const GIT_QUEUE = bullData[BullQueueName.ProcessGitSubmission].name
const GOOGLE_DOCS_QUEUE = bullData[BullQueueName.ProcessGoogleDocsSubmission].name
process.env.BULLMQ_ENQUEUE_UX_DELAY = "1ms"

/** A learner saves a GitHub submission, queues grading, and can observe its durable job. */
describe("a learner submits a challenge for asynchronous grading",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let course: CourseEntity
        let submission: ChallengeSubmissionEntity
        let jobId: string
        let gitQueue: jest.Mocked<Pick<Queue<string>, "add">>

        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = learner
                return true
            },
        }

        const gql = async <T>(query: string, input: Record<string, unknown>): Promise<T> => {
            const response = await request(app.getHttpServer())
                .post("/graphql")
                .send({
                    query,
                    variables: {
                        request: input,
                    },
                })
                .expect(200)
            expect(response.body.errors).toBeUndefined()
            return response.body.data as T
        }

        beforeAll(async () => {
            gitQueue = {
                add: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<Queue<string>, "add">>
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
                    CqrsModule,
                ],
                providers: [
                    SubmitChallengeSubmissionResolver,
                    SubmitChallengeSubmissionService,
                    SubmitChallengeSubmissionHandler,
                    SyncSubmissionResolver,
                    SyncSubmissionService,
                    SyncSubmissionHandler,
                    GraphQLEnrollmentGuard,
                    UserService,
                    JobActionService,
                    JobStalledService,
                    PostgreSqlAdvisoryLockService,
                    EnqueueProcessGitSubmissionJobService,
                    EnqueueProcessGoogleDocsSubmissionJobService,
                    GradingLaneValidationService,
                    AiEntitlementService,
                    AiModelCatalogService,
                    UrlValidatorService,
                    DayjsService,
                    createSuperJsonServiceProvider(),
                    {
                        provide: KeycloakAuthGraphQLGuard,
                        useValue: fakeAuthGuard,
                    },
                    {
                        provide: getQueueToken(GIT_QUEUE),
                        useValue: gitQueue,
                    },
                    {
                        provide: getQueueToken(GOOGLE_DOCS_QUEUE),
                        useValue: {
                            add: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: CacheService,
                        useValue: {
                            get: jest.fn().mockResolvedValue(undefined),
                            set: jest.fn().mockResolvedValue(undefined),
                            del: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: EventEmitterService,
                        useValue: {
                            emit: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: MountFilesystemService,
                        useValue: {
                            appConfig: () => ({
                                subscriptions: {
                                    tiers: [],
                                },
                            }),
                        },
                    },
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: {
                            getAutoQuota: () => ({
                                creditsPer5h: 30,
                                creditsPerWeek: 100,
                            }),
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
            await entityManager.query(
                "TRUNCATE TABLE \"courses\", \"users\", \"jobs\" RESTART IDENTITY CASCADE",
            )
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-challenge-submission-flow",
                }))
            course = await entityManager.save(entityManager.create(CourseEntity,
                {
                    title: "Fullstack Mastery",
                    displayId: "challenge-submission-flow-course",
                    description: "Challenge flow fixture",
                    originalPrice: 999_000,
                    defaultLocale: Locale.En,
                }))
            const module_ = await entityManager.save(entityManager.create(ModuleEntity,
                {
                    title: "NestJS",
                    displayId: "challenge-submission-flow-module",
                    description: "Challenge flow module",
                    defaultLocale: Locale.En,
                    course,
                }))
            const content = await entityManager.save(entityManager.create(ContentEntity,
                {
                    title: "Build an endpoint",
                    displayId: "challenge-submission-flow-content",
                    body: "",
                    defaultLocale: Locale.En,
                    isPremium: false,
                    module: module_,
                }))
            const challenge = await entityManager.save(entityManager.create(ChallengeEntity,
                {
                    title: "Ship the endpoint",
                    displayId: "challenge-submission-flow-challenge",
                    description: "Challenge flow",
                    difficulty: ChallengeDifficulty.Easy,
                    defaultLocale: Locale.En,
                    content,
                }))
            submission = await entityManager.save(entityManager.create(ChallengeSubmissionEntity,
                {
                    type: SubmissionType.GithubUrl,
                    title: "Submit repository",
                    orderIndex: 0,
                    challenge,
                }))
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("saves the learner's repository through GraphQL",
            async () => {
                await gql(`
                    mutation Sync($request: SyncSubmissionRequest!) {
                        syncSubmission(request: $request) { success error }
                    }
                `,
                {
                    id: submission.id,
                    url: "https://github.com/starci/academy",
                })

                const row = await entityManager.findOneOrFail(UserChallengeSubmissionEntity,
                    {
                        where: {
                            user: {
                                id: learner.id,
                            },
                            submission: {
                                id: submission.id,
                            },
                        },
                    })
                expect(row.submissionUrl).toBe("https://github.com/starci/academy")
                const enrollment = await entityManager.findOneOrFail(EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learner.id,
                            },
                            course: {
                                id: course.id,
                            },
                        },
                    })
                expect(enrollment.isEnrolled).toBe(false)
            })

        it("queues grading through GraphQL and persists the tracked job",
            async () => {
                const result = await gql<{
                    submitChallengeSubmission: { data: { jobId: string } }
                }>(`
                    mutation Submit($request: SubmitChallengeSubmissionRequest!) {
                        submitChallengeSubmission(request: $request) {
                            data { jobId }
                        }
                    }
                `,
                {
                    challengeSubmissionId: submission.id,
                })
                jobId = result.submitChallengeSubmission.data.jobId

                const job = await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: jobId,
                    })
                expect(job.status).toBe(JobStatus.Queued)
                expect(job.actionType).toBe(ActionType.ProcessGitSubmission)
                expect(job.userId).toBe(learner.id)
            })

        it("hands the same durable job to the grading queue",
            async () => {
                await until(() => gitQueue.add.mock.calls.length > 0,
                    {
                        timeout: 2_000,
                        describe: "the challenge grading job to reach BullMQ",
                    })
                const job = await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: jobId,
                    })
                expect(gitQueue.add).toHaveBeenCalledWith(job.id,
                    job.payload,
                    {
                        jobId: job.id,
                    })
            })
    })
