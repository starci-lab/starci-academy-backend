import request from "supertest"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    EventEmitterModule,
} from "@nestjs/event-emitter"
import {
    BullModule as NestBullModule,
    getQueueToken,
} from "@nestjs/bullmq"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    Queue,
} from "bullmq"
import type {
    Cache,
} from "cache-manager"
import type {
    Redis as IoRedis,
} from "ioredis"
import type {
    EntityManager,
} from "typeorm"
import {
    JudgeCodingSubmissionWorker,
} from "@features/api/processors/judge-coding-submission/judge-coding-submission.worker"
import {
    JudgeCodingSubmissionStepMappingService,
} from "@features/api/processors/judge-coding-submission/step-mapping.service"
import {
    JudgeCodingSubmissionJudgeStepService,
} from "@features/api/processors/judge-coding-submission/steps/judge-coding-submission-judge-step.service"
import {
    SubmitCodingSolutionResolver,
} from "@features/api/core/graphql/mutations/coding/submit-coding-solution/submit-coding-solution.resolver"
import {
    FLAT_POINTS,
} from "@features/api/processors/ai/shared/xp/points-config"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    CodingProgressService,
} from "@modules/bussiness/coding/coding-progress.service"
import {
    CodingSubmissionService,
} from "@modules/bussiness/coding/coding-submission.service"
import {
    DeviceService,
} from "@modules/bussiness/device/device.service"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobStalledService,
} from "@modules/bussiness/jobs/atomic/job-stalled.service"
import {
    EnqueueJudgeCodingSubmissionJobService,
} from "@modules/bussiness/jobs/enqueue/judge-coding-submission.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    ActivityEntity,
} from "@modules/databases/postgresql/primary/entities/activity.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    CodingProblemTestcaseEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem-testcase.entity"
import {
    CodingSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-submission.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    XpHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/xp-history.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import {
    CodingDifficulty,
} from "@modules/databases/postgresql/primary/enums/coding-difficulty"
import {
    CodingLanguage,
} from "@modules/databases/postgresql/primary/enums/coding-language"
import {
    CodingVerdict,
} from "@modules/databases/postgresql/primary/enums/coding-verdict"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
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
    Judge0Service,
} from "@modules/integrations/judge0/judge0.service"
import {
    Judge0StatusId,
} from "@modules/integrations/judge0/enums/judge0-status"
import type {
    JudgeBatchResult,
    Judge0SubmissionInput,
} from "@modules/integrations/judge0/types/judge0"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakJwksService,
} from "@modules/integrations/keycloak/jwks.service"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
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
    SessionService,
} from "@modules/platform/session/session.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    aiE2eRedisCacheManagerToken,
    createAiE2eRedisProviders,
} from "@tests/helpers/ai-provider-invoke-script"
import {
    until,
} from "@tests/helpers/flow-wait"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const JUDGE_QUEUE_DATA = bullData[BullQueueName.JudgeCodingSubmission]
const SEND_MAIL_QUEUE_DATA = bullData[BullQueueName.SendMail]

interface SubmissionHandle {
    submissionId: string
    jobId: string
}

interface DeferredJudgeResult {
    promise: Promise<JudgeBatchResult>
    resolve: (value: JudgeBatchResult) => void
}

const createDeferredJudgeResult = (): DeferredJudgeResult => {
    let resolveResult: ((value: JudgeBatchResult) => void) | undefined
    const promise = new Promise<JudgeBatchResult>((resolve) => {
        resolveResult = resolve
    })
    return {
        promise,
        resolve: (value) => resolveResult?.(value),
    }
}

const judgeResult = (
    submissions: Array<Judge0SubmissionInput>,
    statusId: Judge0StatusId,
): JudgeBatchResult => ({
    results: submissions.map((submission, index) => ({
        token: `judge-token-${index}`,
        statusId,
        statusDescription: statusId === Judge0StatusId.Accepted
            ? "Accepted"
            : "Time Limit Exceeded",
        stdout: statusId === Judge0StatusId.Accepted
            ? submission.expectedOutput
            : null,
        stderr: null,
        compileOutput: null,
        timeMs: statusId === Judge0StatusId.Accepted ? 18 + index : 2_001,
        memoryKb: 12_000 + index,
    })),
})

/** A learner submits code and the production broker/worker records the verdict exactly once. */
describe("a learner submits a coding solution and receives a durable verdict",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let judgeQueue: Queue<string>
        let cacheRedis: IoRedis
        let redisCache: Cache
        let judgeBatch: jest.Mock<Promise<JudgeBatchResult>, [{ submissions: Array<Judge0SubmissionInput> }]>

        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = learner
                return true
            },
        }

        const submit = async (
            problem: CodingProblemEntity,
            sourceCode: string,
        ): Promise<SubmissionHandle> => {
            const response = await request(app.getHttpServer())
                .post("/graphql")
                .set("x-device-fingerprint",
                    "coding-operational-device")
                .set("user-agent",
                    "starci-e2e")
                .send({
                    query: `
                    mutation Submit($request: SubmitCodingSolutionRequest!) {
                        submitCodingSolution(request: $request) {
                            data { submissionId jobId }
                        }
                    }
                `,
                    variables: {
                        request: {
                            slug: problem.slug,
                            language: CodingLanguage.JavaScript,
                            sourceCode,
                        },
                    },
                })
                .expect(200)
            expect(response.body.errors).toBeUndefined()
            return response.body.data.submitCodingSolution.data as SubmissionHandle
        }

        const createProblem = async (
            slug: string,
            points = 10,
        ): Promise<CodingProblemEntity> => {
            const problem = await entityManager.save(entityManager.create(CodingProblemEntity,
                {
                    slug,
                    difficulty: CodingDifficulty.Easy,
                    title: `Problem ${slug}`,
                    statement: "Return the expected output.",
                    enabled: true,
                    points,
                    timeLimitMs: 2_000,
                    memoryLimitKb: 262_144,
                }))
            await entityManager.save(CodingProblemTestcaseEntity,
                [
                    entityManager.create(CodingProblemTestcaseEntity,
                        {
                            problem,
                            input: "1 2",
                            expectedOutput: "3",
                            isSample: true,
                            orderIndex: 0,
                            sortIndex: 0,
                        }),
                    entityManager.create(CodingProblemTestcaseEntity,
                        {
                            problem,
                            input: "4 5",
                            expectedOutput: "9",
                            isSample: false,
                            orderIndex: 1,
                            sortIndex: 1,
                        }),
                ])
            return problem
        }

        const waitForJobStatus = async (
            jobId: string,
            expectedStatus: JobStatus,
        ): Promise<JobEntity> => {
            await until(async () => {
                const job = await entityManager.findOneBy(JobEntity,
                    {
                        id: jobId,
                    })
                return job?.status === expectedStatus
            },
            {
                timeout: 15_000,
                describe: `coding job ${jobId} to become ${expectedStatus}`,
            })
            return entityManager.findOneByOrFail(JobEntity,
                {
                    id: jobId,
                })
        }

        const waitForBrokerCompletion = async (jobId: string): Promise<void> => {
            await until(async () => (await judgeQueue.getJobState(jobId)) === "completed",
                {
                    timeout: 15_000,
                    describe: `coding broker job ${jobId} to become completed`,
                })
        }

        const expectSingleReward = async (
            problem: CodingProblemEntity,
            submissionId: string,
        ): Promise<void> => {
            expect(await entityManager.count(XpHistoryEntity,
                {
                    where: {
                        source: XpSource.Coding,
                        refId: submissionId,
                    },
                })).toBe(1)
            const xp = await entityManager.findOneByOrFail(XpHistoryEntity,
                {
                    source: XpSource.Coding,
                    refId: submissionId,
                })
            expect(xp.amount).toBe(problem.points)
            expect(xp.points).toBe(FLAT_POINTS.codingSolved)
            expect(await entityManager.count(ActivityEntity,
                {
                    where: {
                        type: ActivityType.CodingSolved,
                        idempotencyKey: `codingSolved:${learner.id}:${problem.id}`,
                    },
                })).toBe(1)
            const refreshedLearner = await entityManager.findOneByOrFail(UserEntity,
                {
                    id: learner.id,
                })
            const rewardedSubmissions = await entityManager.count(XpHistoryEntity,
                {
                    where: {
                        user: {
                            id: learner.id,
                        },
                        source: XpSource.Coding,
                    },
                })
            expect(Number(refreshedLearner.coinBalance)).toBe(
                rewardedSubmissions * FLAT_POINTS.codingSolved,
            )
        }

        beforeAll(async () => {
            process.env.BULLMQ_ENQUEUE_UX_DELAY = "0ms"
            judgeBatch = jest.fn()
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
                    NestBullModule.forRoot({
                        connection: {
                            host: process.env.REDIS_BULLMQ_HOST,
                            port: Number(process.env.REDIS_BULLMQ_PORT),
                            password: process.env.REDIS_BULLMQ_PASSWORD,
                        },
                    }),
                    NestBullModule.registerQueue(
                        {
                            name: JUDGE_QUEUE_DATA.name,
                            prefix: JUDGE_QUEUE_DATA.prefix,
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
                            name: SEND_MAIL_QUEUE_DATA.name,
                            prefix: SEND_MAIL_QUEUE_DATA.prefix,
                        },
                    ),
                ],
                providers: [
                    ...createAiE2eRedisProviders(),
                    createSuperJsonServiceProvider(),
                    SubmitCodingSolutionResolver,
                    CodingSubmissionService,
                    CodingProgressService,
                    DeviceService,
                    EnqueueJudgeCodingSubmissionJobService,
                    EnqueueSendMailJobService,
                    JobActionService,
                    JobStalledService,
                    NotificationService,
                    UserStatsProjectionService,
                    CacheService,
                    DayjsService,
                    EventEmitterService,
                    JudgeCodingSubmissionWorker,
                    JudgeCodingSubmissionStepMappingService,
                    JudgeCodingSubmissionJudgeStepService,
                    {
                        provide: Judge0Service,
                        useValue: {
                            judgeBatch,
                        },
                    },
                    {
                        provide: NatsProducerService,
                        useValue: {
                            publish: () => undefined,
                        },
                    },
                    {
                        provide: NatsMessageFactoryService,
                        useValue: {
                            create: () => "{}",
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: () => undefined,
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
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            judgeQueue = app.get<Queue<string>>(getQueueToken(JUDGE_QUEUE_DATA.name))
            cacheRedis = app.get<IoRedis>(
                createIoRedisKey(IoRedisInstanceKey.Cache),
            )
            redisCache = app.get<Cache>(aiE2eRedisCacheManagerToken)
            await entityManager.query(
                "TRUNCATE TABLE \"coding_problems\", \"users\", \"jobs\", \"devices\" RESTART IDENTITY CASCADE",
            )
            await judgeQueue.drain(true)
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-coding-operational-flow",
                }))
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
            await redisCache?.disconnect()
            cacheRedis?.disconnect()
        })

        beforeEach(() => {
            judgeBatch.mockReset()
        })

        it("completes an accepted submission once when duplicate broker deliveries race",
            async () => {
                const problem = await createProblem("accepted-duplicate")
                const deferred = createDeferredJudgeResult()
                let capturedSubmissions: Array<Judge0SubmissionInput> = []
                judgeBatch.mockImplementation(async ({ submissions }) => {
                    capturedSubmissions = submissions
                    return deferred.promise
                })

                const handle = await submit(problem,
                    "console.log('accepted')")
                await until(() => judgeBatch.mock.calls.length === 1,
                    {
                        timeout: 5_000,
                        describe: "the production coding worker to reach Judge0",
                    })

                const trackedJob = await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: handle.jobId,
                    })
                await Promise.all([
                    judgeQueue.add(trackedJob.id,
                        trackedJob.payload,
                        {
                            jobId: trackedJob.id,
                        }),
                    judgeQueue.add(trackedJob.id,
                        trackedJob.payload,
                        {
                            jobId: trackedJob.id,
                        }),
                ])
                deferred.resolve(judgeResult(capturedSubmissions,
                    Judge0StatusId.Accepted))

                const terminalJob = await waitForJobStatus(handle.jobId,
                    JobStatus.Completed)
                const submission = await entityManager.findOneByOrFail(CodingSubmissionEntity,
                    {
                        id: handle.submissionId,
                    })
                expect(terminalJob.status).toBe(JobStatus.Completed)
                expect(terminalJob.actionType).toBe(ActionType.JudgeCodingSubmission)
                expect(terminalJob.currentStep).toBe(terminalJob.maxSteps)
                expect(submission.verdict).toBe(CodingVerdict.Accepted)
                expect(submission.passedCount).toBe(2)
                expect(submission.totalCount).toBe(2)
                expect(await entityManager.count(CodingSubmissionEntity,
                    {
                        where: {
                            id: handle.submissionId,
                        },
                    })).toBe(1)
                expect(judgeBatch).toHaveBeenCalledTimes(1)
                await waitForBrokerCompletion(handle.jobId)
                await expectSingleReward(problem,
                    handle.submissionId)
            })

        it("persists a time-limit verdict as a completed business result without rewards",
            async () => {
                const problem = await createProblem("time-limit")
                judgeBatch.mockImplementation(async ({ submissions }) =>
                    judgeResult(submissions,
                        Judge0StatusId.TimeLimitExceeded))

                const handle = await submit(problem,
                    "while (true) {}")
                const terminalJob = await waitForJobStatus(handle.jobId,
                    JobStatus.Completed)
                const submission = await entityManager.findOneByOrFail(CodingSubmissionEntity,
                    {
                        id: handle.submissionId,
                    })
                expect(terminalJob.status).toBe(JobStatus.Completed)
                expect(submission.verdict).toBe(CodingVerdict.TimeLimitExceeded)
                expect(submission.passedCount).toBe(0)
                expect(submission.totalCount).toBe(2)
                expect(await entityManager.count(XpHistoryEntity,
                    {
                        where: {
                            source: XpSource.Coding,
                            refId: handle.submissionId,
                        },
                    })).toBe(0)
                expect(await entityManager.count(ActivityEntity,
                    {
                        where: {
                            type: ActivityType.CodingSolved,
                            idempotencyKey: `codingSolved:${learner.id}:${problem.id}`,
                        },
                    })).toBe(0)
                await waitForBrokerCompletion(handle.jobId)
            })

        it("retries a transient Judge0 failure and commits one attempt, reward, and activity",
            async () => {
                const problem = await createProblem("retry-success")
                judgeBatch
                    .mockRejectedValueOnce(new Error("Judge0 temporarily unavailable"))
                    .mockImplementationOnce(async ({ submissions }) =>
                        judgeResult(submissions,
                            Judge0StatusId.Accepted))

                const handle = await submit(problem,
                    "console.log('retry')")
                const terminalJob = await waitForJobStatus(handle.jobId,
                    JobStatus.Completed)
                const submission = await entityManager.findOneByOrFail(CodingSubmissionEntity,
                    {
                        id: handle.submissionId,
                    })
                const brokerJob = await judgeQueue.getJob(handle.jobId)
                expect(terminalJob.status).toBe(JobStatus.Completed)
                expect(terminalJob.error).toBeNull()
                expect(submission.verdict).toBe(CodingVerdict.Accepted)
                expect(judgeBatch).toHaveBeenCalledTimes(2)
                expect(brokerJob?.attemptsMade).toBe(2)
                expect(await entityManager.count(CodingSubmissionEntity,
                    {
                        where: {
                            id: handle.submissionId,
                        },
                    })).toBe(1)
                await expectSingleReward(problem,
                    handle.submissionId)
            })
    })
