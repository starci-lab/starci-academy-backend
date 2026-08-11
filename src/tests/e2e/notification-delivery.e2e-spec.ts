import type {
    Namespace,
} from "socket.io"
import {
    io,
    type Socket,
} from "socket.io-client"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    NotificationEntity,
} from "@modules/databases/postgresql/primary/entities/notification.entity"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
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
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
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
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"
import {
    expectNoMessage,
    nextMessage,
    until,
} from "@tests/helpers/flow-wait"

interface NotificationSocketMessage {
    success: boolean
    data: {
        notification: {
            id: string
            type: NotificationType
        }
    }
}

/** An in-process event persists a notification and delivers it only to its recipient. */
describe("a domain event persists a notification and delivers it to the learner",
    () => {
        let world: FlowWorld
        let notificationService: NotificationService
        let roomService: NotificationRoomService
        let gatewayNamespace: Namespace
        let recipient: UserEntity
        let stranger: UserEntity
        let recipientSocket: Socket
        let strangerSocket: Socket
        let recipientSocketId: string
        let strangerSocketId: string

        const listeners = new Map<EventName, Array<(payload: unknown) => void>>()
        const eventEmitterService = {
            on: jest.fn((params: {
                event: EventName
                listener: (payload: unknown) => void
            }) => {
                const current = listeners.get(params.event) ?? []
                current.push(params.listener)
                listeners.set(params.event,
                    current)
            }),
            emit: jest.fn(async (params: {
                event: EventName
                payload: unknown
            }) => {
                for (const listener of listeners.get(params.event) ?? []) {
                    listener(params.payload)
                }
            }),
            off: jest.fn(),
        }

        const connect = async (
            baseUrl: string,
            token: string,
        ): Promise<Socket> => {
            const socket = io(`${baseUrl}/notifications`,
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
            world = await bootFlowWorld({
                providers: [
                    UserService,
                    UserStatsProjectionService,
                    NotificationService,
                    NotificationRoomService,
                    WsResponseService,
                    NotificationsGateway,
                    {
                        provide: SUPERJSON,
                        useValue: {
                            stringify: JSON.stringify,
                            parse: JSON.parse,
                        },
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            verifyAccessToken: jest.fn(async (token: string) => ({
                                active: true,
                                sub: token === "recipient-token"
                                    ? "kc-notification-recipient"
                                    : "kc-notification-stranger",
                            })),
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
            globalThis.__APP__ = world.app
            await world.app.listen(0)
            notificationService = world.app.get(NotificationService)
            roomService = world.app.get(NotificationRoomService)
            gatewayNamespace = (world.app.get(NotificationsGateway) as unknown as {
                server: Namespace
            }).server

            await world.truncate(
                "notifications",
                "user_stats_projections",
                "users",
            )
            recipient = await world.entityManager.save(
                world.entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-notification-recipient",
                    }),
            )
            stranger = await world.entityManager.save(
                world.entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-notification-stranger",
                    }),
            )

            const baseUrl = await world.app.getUrl()
            recipientSocket = await connect(baseUrl,
                "recipient-token")
            strangerSocket = await connect(baseUrl,
                "stranger-token")
            if (!recipientSocket.id || !strangerSocket.id) {
                throw new Error("Connected notification sockets must have ids")
            }
            recipientSocketId = recipientSocket.id
            strangerSocketId = strangerSocket.id
            recipientSocket.emit(PublicationEvent.SubscribeNotifications)
            strangerSocket.emit(PublicationEvent.SubscribeNotifications)

            await until(
                () => Boolean(gatewayNamespace.adapter.rooms.get(
                    roomService.name(recipient.id),
                )?.has(recipientSocketId)),
                {
                    describe: "the recipient socket to join its private notification room",
                },
            )
            await until(
                () => Boolean(gatewayNamespace.adapter.rooms.get(
                    roomService.name(stranger.id),
                )?.has(strangerSocketId)),
                {
                    describe: "the stranger socket to join its private notification room",
                },
            )
        })

        afterAll(async () => {
            recipientSocket?.disconnect()
            strangerSocket?.disconnect()
            await world?.close()
        })

        it("commits the row and pushes its snapshot only to the recipient room",
            async () => {
                const recipientMessage = nextMessage<NotificationSocketMessage>(
                    recipientSocket,
                    SubscriptionEvent.NotificationCreated,
                )
                const strangerSilence = expectNoMessage(
                    strangerSocket,
                    SubscriptionEvent.NotificationCreated,
                    () => true,
                    {
                        within: 500,
                    },
                )

                const created = await notificationService.createNotification({
                    userId: recipient.id,
                    type: NotificationType.System,
                    title: {
                        key: "notification.flow.title",
                    },
                    body: {
                        key: "notification.flow.body",
                    },
                })

                const message = await recipientMessage
                await strangerSilence
                expect(message.success).toBe(true)
                expect(message.data.notification.id).toBe(created.id)
                expect(message.data.notification.type).toBe(NotificationType.System)

                const persisted = await world.entityManager.findOneByOrFail(
                    NotificationEntity,
                    {
                        id: created.id,
                    },
                )
                expect(persisted.userId).toBe(recipient.id)
                expect(persisted.readAt).toBeNull()
            })
    })
