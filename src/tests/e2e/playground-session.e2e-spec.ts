import request from "supertest"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    Test,
} from "@nestjs/testing"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    io,
    type Socket,
} from "socket.io-client"
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
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    PlaygroundEntity,
} from "@modules/databases/postgresql/primary/entities/playground.entity"
import {
    PlaygroundSessionEntity,
} from "@modules/databases/postgresql/primary/entities/playground-session.entity"
import {
    PlaygroundStepEntity,
} from "@modules/databases/postgresql/primary/entities/playground-step.entity"
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
    PlaygroundResolverService,
} from "@modules/databases/postgresql/primary/resolvers/playground-resolver.service"
import {
    TranslationResolverService,
} from "@modules/databases/postgresql/primary/resolvers/translation.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
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
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CreatePlaygroundSessionHandler,
} from "@features/api/core/graphql/mutations/playground-sessions/create-playground-session/create-playground-session.handler"
import {
    CreatePlaygroundSessionResolver,
} from "@features/api/core/graphql/mutations/playground-sessions/create-playground-session/create-playground-session.resolver"
import {
    CreatePlaygroundSessionService,
} from "@features/api/core/graphql/mutations/playground-sessions/create-playground-session/create-playground-session.service"
import {
    PublicationEvent,
} from "@features/socketio/core/enums/publication-event"
import {
    SubscriptionEvent,
} from "@features/socketio/core/enums/subscription-event"
import {
    PlaygroundByomGateway,
} from "@features/socketio/core/playground-byom/playground-byom.gateway"
import {
    PlaygroundByomRoomService,
} from "@features/socketio/core/playground-byom/playground-byom-room.service"
import type {
    AgentPairAck,
} from "@features/socketio/core/playground-byom/types/payload"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
import {
    nextMessage,
    until,
} from "@tests/helpers/flow-wait"

interface SocketEnvelope<T> {
    success: boolean
    data: T
}

/** An enrolled learner starts a lab, pairs their machine, and completes its first step. */
describe("an enrolled learner pairs a playground agent and completes a step",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let playground: PlaygroundEntity
        let browser: Socket
        let agent: Socket

        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = learner
                return true
            },
        }

        const connect = async (
            baseUrl: string,
            token: string,
        ): Promise<Socket> => {
            const socket = io(`${baseUrl}/playground_byom`,
                {
                    transports: [
                        "websocket",
                    ],
                    auth: {
                        token,
                    },
                    forceNew: true,
                })
            await new Promise<void>((resolve, reject) => {
                socket.once("connect",
                    resolve)
                socket.once("connect_error",
                    reject)
            })
            return socket
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    CqrsModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                ],
                providers: [
                    AiEntitlementService,
                    DayjsService,
                    TranslationResolverService,
                    PlaygroundResolverService,
                    CreatePlaygroundSessionResolver,
                    CreatePlaygroundSessionService,
                    CreatePlaygroundSessionHandler,
                    PlaygroundByomRoomService,
                    WsResponseService,
                    PlaygroundByomGateway,
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
                                usesPer5h: 30,
                                usesPerWeek: 100,
                            }),
                        },
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            verifyAccessToken: jest.fn().mockResolvedValue({
                                active: true,
                                sub: "kc-playground-flow",
                            }),
                        },
                    },
                    {
                        provide: createIoRedisKey(IoRedisInstanceKey.Cache),
                        useValue: {
                            incr: jest.fn().mockResolvedValue(1),
                            ttl: jest.fn().mockResolvedValue(60),
                            expire: jest.fn().mockResolvedValue(1),
                        },
                    },
                    {
                        provide: SUPERJSON,
                        useValue: {
                            stringify: JSON.stringify,
                            parse: JSON.parse,
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
            globalThis.__APP__ = app
            await app.listen(0)
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            await entityManager.query(`TRUNCATE TABLE
                "playground_sessions",
                "playground_steps",
                "playgrounds",
                "enrollments",
                "users",
                "courses"
                RESTART IDENTITY CASCADE`)

            learner = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-playground-flow",
                    }),
            )
            const course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Container Operations",
                        displayId: "playground-flow-course",
                        description: "A deterministic playground fixture.",
                        originalPrice: 100_000,
                        defaultLocale: Locale.En,
                    }),
            )
            await entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user: learner,
                        course,
                        pricingPhase: PricingPhase.Regular,
                        isEnrolled: true,
                    }),
            )
            playground = await entityManager.save(
                entityManager.create(PlaygroundEntity,
                    {
                        slug: "container-operations",
                        title: "Container Operations",
                        description: "Pair an agent and report a running container.",
                        icon: null,
                        kind: "terminal",
                        course,
                        sortIndex: 0,
                        translations: [],
                    }),
            )
            await entityManager.save(
                entityManager.create(PlaygroundStepEntity,
                    {
                        playground,
                        sortIndex: 0,
                        title: "Start the API container",
                        body: "Run the API container and verify it is healthy.",
                        commandHint: "docker run starci-api",
                        actionHint: null,
                        verifyKind: null,
                        verifyResourceKind: "Container",
                        verifyResourceNamePattern: "starci-api",
                        verifyExpectedStatus: "Running",
                        translations: [],
                    }),
            )
        })

        afterAll(async () => {
            browser?.disconnect()
            agent?.disconnect()
            await app?.close().catch(() => undefined)
        })

        it("persists the session, pairs the real socket client, and advances verified progress",
            async () => {
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            mutation StartPlayground($request: CreatePlaygroundSessionRequest!) {
                                createPlaygroundSession(request: $request) {
                                    data { id pairingCode mode steps { title commandHint } }
                                }
                            }
                        `,
                        variables: {
                            request: {
                                playgroundId: playground.id,
                                mode: "guided",
                            },
                        },
                    })
                    .expect(200)
                expect(response.body.errors).toBeUndefined()
                const started = response.body.data.createPlaygroundSession.data as {
                    id: string
                    pairingCode: string
                    mode: string
                    steps: Array<{ title: string, commandHint: string | null }>
                }

                const created = await entityManager.findOneByOrFail(
                    PlaygroundSessionEntity,
                    {
                        id: started.id,
                    },
                )
                expect(created.userId).toBe(learner.id)
                expect(created.playgroundId).toBe(playground.id)
                expect(created.connected).toBe(false)
                expect(started.steps).toEqual([
                    expect.objectContaining({
                        title: "Start the API container",
                        commandHint: "docker run starci-api",
                    }),
                ])

                const baseUrl = await app.getUrl()
                browser = await connect(baseUrl,
                    "owner-token")
                agent = await connect(baseUrl,
                    "agent-token")
                browser.emit(PublicationEvent.PlaygroundBrowserSubscribe,
                    {
                        sessionId: started.id,
                    })
                await nextMessage<SocketEnvelope<{ connected: boolean }>>(
                    browser,
                    SubscriptionEvent.PlaygroundAgentDisconnected,
                )

                const connected = nextMessage<{ connected: boolean }>(
                    browser,
                    SubscriptionEvent.PlaygroundAgentConnected,
                )
                const paired = await new Promise<AgentPairAck>((resolve) => {
                    agent.emit(
                        PublicationEvent.PlaygroundAgentPair,
                        {
                            pairingCode: started.pairingCode,
                        },
                        resolve,
                    )
                })
                expect(paired).toEqual(expect.objectContaining({
                    sessionId: started.id,
                    playgroundSlug: playground.slug,
                    currentStepIndex: 0,
                }))
                expect((await connected).connected).toBe(true)

                const verified = nextMessage<SocketEnvelope<{ stepIndex: number }>>(
                    browser,
                    SubscriptionEvent.PlaygroundStepVerified,
                )
                agent.emit(PublicationEvent.PlaygroundResourcesReport,
                    {
                        resources: [
                            {
                                kind: "Container",
                                name: "starci-api-1",
                                status: "Running",
                            },
                        ],
                    })
                expect((await verified).data.stepIndex).toBe(0)

                await until(async () => {
                    const session = await entityManager.findOneByOrFail(
                        PlaygroundSessionEntity,
                        {
                            id: started.id,
                        },
                    )
                    return session.connected
                        && session.currentStepIndex === 1
                        && session.passedStepIndexes.includes(0)
                },
                {
                    describe: "the paired playground session to persist verified progress",
                })
            })
    })
