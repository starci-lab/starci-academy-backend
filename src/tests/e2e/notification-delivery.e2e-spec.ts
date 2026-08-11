import request from "supertest"
import type {
    Namespace,
} from "socket.io"
import {
    io,
    type Socket,
} from "socket.io-client"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
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
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    SetFollowResolver,
} from "@features/api/core/graphql/mutations/follows/set-follow/set-follow.resolver"
import {
    NotificationsGateway,
} from "@features/socketio/core/notifications/notifications.gateway"
import {
    NotificationRoomService,
} from "@features/socketio/core/notifications/notification-room.service"
import {
    PublicationEvent,
} from "@features/socketio/core/enums/publication-event"
import {
    SubscriptionEvent,
} from "@features/socketio/core/enums/subscription-event"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    NotificationEntity,
} from "@modules/databases/postgresql/primary/entities/notification.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    expectNoMessage,
    nextMessage,
    until,
} from "@tests/helpers/flow-wait"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

interface NotificationSocketMessage {
    success: boolean
    data: { notification: { id: string; type: NotificationType } }
}

interface FlowEventListenerParams {
    event: EventName
    listener: (payload: unknown) => void
}

interface FlowEventEmitParams {
    event: EventName
    payload: unknown
}

describe("a follow notification reaches only the followed learner",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let follower: UserEntity | null = null
        let recipient: UserEntity
        let stranger: UserEntity
        let recipientSocket: Socket
        let strangerSocket: Socket
        const listeners = new Map<EventName, Array<(payload: unknown) => void>>()
        const events = {
            on: jest.fn(({ event, listener }: FlowEventListenerParams) => {
                listeners.set(event,
                    [...(listeners.get(event) ?? []),
                        listener])
            }),
            emit: jest.fn(async ({ event, payload }: FlowEventEmitParams) => {
                for (const listener of listeners.get(event) ?? []) listener(payload)
            }),
            off: jest.fn(),
        }
        const guard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!follower) return false
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = follower
                return true
            },
        }

        const connect = async (token: string): Promise<Socket> => {
            const socket = io(`${await app.getUrl()}/notifications`,
                {
                    transports: ["websocket"], auth: {
                        token
                    }, forceNew: true
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
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic, useServices: false
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true, withHydration: false, withResolvers: false
                    }),
                ],
                providers: [
                    SetFollowResolver,
                    UserService,
                    UserStatsProjectionService,
                    NotificationService,
                    NotificationRoomService,
                    WsResponseService,
                    NotificationsGateway,
                    {
                        provide: SUPERJSON, useValue: {
                            stringify: JSON.stringify, parse: JSON.parse
                        }
                    },
                    {
                        provide: EventEmitterService, useValue: events
                    },
                    {
                        provide: KeycloakTokenService, useValue: {
                            verifyAccessToken: jest.fn(async (token: string) => ({
                                active: true, sub: token
                            }))
                        }
                    },
                    {
                        provide: CacheService,
                        useValue: {
                            get: jest.fn().mockResolvedValue(undefined),
                            set: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: WinstonService, useValue: {
                            log: jest.fn()
                        }
                    },
                ],
            }).overrideGuard(KeycloakAuthGraphQLGuard).useValue(guard).compile()
            app = moduleRef.createNestApplication()
            globalThis.__APP__ = app
            await app.listen(0)
            entityManager = app.get(getEntityManagerToken("primary"))
            await entityManager.query("TRUNCATE TABLE \"user_follows\", \"activities\", \"notifications\", \"user_stats_projections\", \"users\" RESTART IDENTITY CASCADE")
            follower = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-notification-follower", username: "follower"
                }))
            recipient = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-notification-recipient", username: "recipient"
                }))
            stranger = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-notification-stranger", username: "stranger"
                }))
            recipientSocket = await connect(recipient.keycloakId)
            strangerSocket = await connect(stranger.keycloakId)
            recipientSocket.emit(PublicationEvent.SubscribeNotifications)
            strangerSocket.emit(PublicationEvent.SubscribeNotifications)
            const namespace = (app.get(NotificationsGateway) as unknown as { server: Namespace }).server
            const rooms = app.get(NotificationRoomService)
            await until(() => Boolean(recipientSocket.id && namespace.adapter.rooms.get(rooms.name(recipient.id))?.has(recipientSocket.id)),
                {
                    describe: "the recipient to join its notification room"
                })
            await until(() => Boolean(strangerSocket.id && namespace.adapter.rooms.get(rooms.name(stranger.id))?.has(strangerSocket.id)),
                {
                    describe: "the stranger to join its notification room"
                })
        })

        afterAll(async () => {
            recipientSocket?.disconnect()
            strangerSocket?.disconnect()
            await app?.close().catch(() => undefined)
        })

        it("persists and emits the notification without leaking it to another socket",
            async () => {
                const delivered = nextMessage<NotificationSocketMessage>(recipientSocket,
                    SubscriptionEvent.NotificationCreated)
                const silence = expectNoMessage(strangerSocket,
                    SubscriptionEvent.NotificationCreated,
                    () => true,
                    {
                        within: 500
                    })
                const response = await request(app.getHttpServer()).post("/graphql").send({
                    query: `mutation { setFollow(request: { userId: "${recipient.id}", follow: true }) { success error } }`,
                })
                expect(response.body).toHaveProperty("data.setFollow.success",
                    true)
                const message = await delivered
                await silence
                expect(message.data.notification.type).toBe(NotificationType.NewFollower)
                const persisted = await entityManager.findOneByOrFail(NotificationEntity,
                    {
                        id: message.data.notification.id
                    })
                expect(persisted.userId).toBe(recipient.id)
            })
    })
