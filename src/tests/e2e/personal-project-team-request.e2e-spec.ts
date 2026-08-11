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
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobStalledService,
} from "@modules/bussiness/jobs/atomic/job-stalled.service"
import {
    EnqueueResolveGithubJobService,
} from "@modules/bussiness/jobs/enqueue/resolve-github.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
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
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
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
    RequestToTeamHandler,
} from "@features/api/core/graphql/mutations/personal-project/request-to-team/request-to-team.handler"
import {
    RequestToTeamResolver,
} from "@features/api/core/graphql/mutations/personal-project/request-to-team/request-to-team.resolver"
import {
    RequestToTeamService,
} from "@features/api/core/graphql/mutations/personal-project/request-to-team/request-to-team.service"
import {
    until,
} from "@tests/helpers/flow-wait"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const POSTGRESQL_PRIMARY = "primary"
const RESOLVE_GITHUB_QUEUE = bullData[BullQueueName.ResolveGithub].name
const COURSE_SLUG = "personal-project-team-flow"
process.env.BULLMQ_ENQUEUE_UX_DELAY = "1ms"
process.env.GITHUB_TEAM_SLUGS_BY_COURSE_SLUG = JSON.stringify({
    [COURSE_SLUG]: "learners",
})

/** A learner with a linked GitHub identity requests the course project team. */
describe("a learner requests access to the personal-project GitHub team",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let course: CourseEntity
        let queue: jest.Mocked<Pick<Queue<string>, "add">>
        let jobId: string

        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = learner
                return true
            },
        }

        beforeAll(async () => {
            queue = {
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
                    RequestToTeamResolver,
                    RequestToTeamService,
                    RequestToTeamHandler,
                    EnqueueResolveGithubJobService,
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
                        provide: getQueueToken(RESOLVE_GITHUB_QUEUE),
                        useValue: queue,
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
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"courses\", \"jobs\" RESTART IDENTITY CASCADE",
            )
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-personal-project-team-flow",
                    githubUsername: "starci-learner",
                }))
            course = await entityManager.save(entityManager.create(CourseEntity,
                {
                    title: "Fullstack Mastery",
                    displayId: COURSE_SLUG,
                    description: "Team request fixture",
                    originalPrice: 999_000,
                    defaultLocale: Locale.En,
                }))
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("requests the team through GraphQL and persists a tracked invite job",
            async () => {
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            mutation RequestTeam($request: RequestToTeamRequest!) {
                                requestToTeam(request: $request) {
                                    data { requested jobId }
                                }
                            }
                        `,
                        variables: {
                            request: {
                                courseId: course.id,
                            },
                        },
                    })
                    .expect(200)
                expect(response.body.errors).toBeUndefined()
                expect(response.body.data.requestToTeam.data.requested).toBe(true)
                jobId = response.body.data.requestToTeam.data.jobId

                const job = await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: jobId,
                    })
                expect(job.status).toBe(JobStatus.Queued)
                expect(job.actionType).toBe(ActionType.ResolveGithub)
                expect(job.userId).toBe(learner.id)
            })

        it("hands the same durable invite job to the GitHub worker queue",
            async () => {
                await until(() => queue.add.mock.calls.length > 0,
                    {
                        timeout: 2_000,
                        describe: "the GitHub team invite job to reach BullMQ",
                    })
                const job = await entityManager.findOneByOrFail(JobEntity,
                    {
                        id: jobId,
                    })
                expect(queue.add).toHaveBeenCalledWith(job.id,
                    job.payload,
                    {
                        jobId: job.id,
                    })
            })
    })
