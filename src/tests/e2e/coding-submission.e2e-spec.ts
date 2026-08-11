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
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    getQueueToken,
} from "@nestjs/bullmq"
import type {
    EntityManager,
} from "typeorm"
import type {
    Queue,
} from "bullmq"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
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
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    CodingProblemSolutionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem-solution.entity"
import {
    CodingSolutionRevealEntity,
} from "@modules/databases/postgresql/primary/entities/coding-solution-reveal.entity"
import {
    CodingSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-submission.entity"
import {
    DeviceEntity,
} from "@modules/databases/postgresql/primary/entities/device.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
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
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
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
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    RevealCodingSolutionResolver,
} from "@features/api/core/graphql/mutations/coding/reveal-coding-solution/reveal-coding-solution.resolver"
import {
    SubmitCodingSolutionResolver,
} from "@features/api/core/graphql/mutations/coding/submit-coding-solution/submit-coding-solution.resolver"
import {
    until,
} from "@tests/helpers/flow-wait"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const POSTGRESQL_PRIMARY = "primary"
const JUDGE_QUEUE = bullData[BullQueueName.JudgeCodingSubmission].name
process.env.BULLMQ_ENQUEUE_UX_DELAY = "1ms"

/** A learner submits code for judging and later reveals the reference solution. */
describe("a learner submits a coding solution and the judging work is durable",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let problem: CodingProblemEntity
        let submissionId: string
        let jobId: string
        let judgeQueue: jest.Mocked<Pick<Queue<string>, "add">>

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
                .set("x-device-fingerprint",
                    "coding-flow-device")
                .set("user-agent",
                    "starci-e2e")
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
            judgeQueue = {
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
                ],
                providers: [
                    SubmitCodingSolutionResolver,
                    RevealCodingSolutionResolver,
                    CodingSubmissionService,
                    DeviceService,
                    EnqueueJudgeCodingSubmissionJobService,
                    JobActionService,
                    JobStalledService,
                    DayjsService,
                    createSuperJsonServiceProvider(),
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
                    {
                        provide: EventEmitterService,
                        useValue: {
                            emit: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: getQueueToken(JUDGE_QUEUE),
                        useValue: judgeQueue,
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
                "TRUNCATE TABLE \"coding_problems\", \"users\", \"jobs\", \"devices\" RESTART IDENTITY CASCADE",
            )
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-coding-submission-flow",
                }))
            problem = await entityManager.save(entityManager.create(CodingProblemEntity,
                {
                    slug: "two-sum-flow",
                    difficulty: CodingDifficulty.Easy,
                    title: "Two Sum",
                    statement: "Return indices that add up to the target.",
                    enabled: true,
                }))
            await entityManager.save(entityManager.create(CodingProblemSolutionEntity,
                {
                    problem,
                    language: CodingLanguage.JavaScript,
                    code: "function twoSum(nums, target) { return [0, 1] }",
                }))
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("submits through GraphQL and persists the pending submission and device",
            async () => {
                const result = await gql<{
                    submitCodingSolution: { data: { submissionId: string; jobId: string } }
                }>(`
                    mutation Submit($request: SubmitCodingSolutionRequest!) {
                        submitCodingSolution(request: $request) {
                            data { submissionId jobId }
                        }
                    }
                `,
                {
                    slug: problem.slug,
                    language: CodingLanguage.JavaScript,
                    sourceCode: "function twoSum(nums, target) { return [0, 1] }",
                })
                submissionId = result.submitCodingSolution.data.submissionId
                jobId = result.submitCodingSolution.data.jobId

                const submission = await entityManager.findOneByOrFail(CodingSubmissionEntity,
                    {
                        id: submissionId,
                    })
                expect(submission.verdict).toBe(CodingVerdict.Pending)
                expect(await entityManager.count(DeviceEntity,
                    {
                        where: {
                            user: {
                                id: learner.id,
                            },
                            fingerprint: "coding-flow-device",
                        },
                    })).toBe(1)
            })

        it("persists and hands the tracked judging job to BullMQ",
            async () => {
                const job = await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: jobId,
                    })
                expect(job.status).toBe(JobStatus.Queued)
                expect(job.actionType).toBe(ActionType.JudgeCodingSubmission)
                await until(() => judgeQueue.add.mock.calls.length > 0,
                    {
                        timeout: 2_000,
                        describe: "the coding job to reach BullMQ",
                    })
                expect(judgeQueue.add).toHaveBeenCalledWith(job.id,
                    job.payload,
                    {
                        jobId: job.id,
                    })
            })

        it("reveals the reference solution through GraphQL and persists the forfeit",
            async () => {
                const result = await gql<{
                    revealCodingSolution: { data: { revealed: boolean } }
                }>(`
                    mutation Reveal($request: RevealCodingSolutionRequest!) {
                        revealCodingSolution(request: $request) {
                            data { revealed solutions { language code } }
                        }
                    }
                `,
                {
                    slug: problem.slug,
                })
                expect(result.revealCodingSolution.data.revealed).toBe(true)
                expect(await entityManager.count(CodingSolutionRevealEntity,
                    {
                        where: {
                            user: {
                                id: learner.id,
                            },
                            problem: {
                                id: problem.id,
                            },
                        },
                    })).toBe(1)
            })
    })
