import {
    OnModuleInit,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ConnectedSocket,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import type {
    Namespace,
} from "socket.io"
import {
    NotificationsWebSocketGateway,
} from "@modules/platform/socketio/decorators/gateway"
import {
    socketIoKeycloakAuthMiddleware,
} from "@modules/platform/socketio/middlewares/keycloak-auth"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import type {
    TypedSocket,
} from "@modules/platform/socketio/types/socket"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import type {
    NotificationCreatedEventPayload,
} from "@modules/platform/event/types/event-payload/notification"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    PublicationEvent,
} from "../enums/publication-event"
import {
    SubscriptionEvent,
} from "../enums/subscription-event"
import {
    NotificationRoomService,
} from "./notification-room.service"
import type {
    NotificationCreatedSocketIoMessage,
} from "./types/message"

@NotificationsWebSocketGateway()
/**
 * WebSocket gateway for the `/notifications` namespace -- per-user bell realtime.
 *
 * A client connects with its Keycloak access token (verified by the auth
 * middleware, which stamps `socket.data.userId` with the keycloak `sub`), then
 * subscribes. The handler resolves the keycloak sub to the internal
 * {@link UserEntity} id and joins the caller to its OWN private room
 * (`notifications:{userId}`) -- so a client can never receive another user's
 * notifications. Whenever {@link NotificationService} creates a notification it
 * fans out a local {@link EventName.NotificationCreated} event; this gateway
 * forwards it to the recipient's room as a {@link SubscriptionEvent.NotificationCreated}.
 */
export class NotificationsGateway implements OnModuleInit {
    constructor(
        private readonly userService: UserService,
        private readonly notificationRoomService: NotificationRoomService,
        private readonly wsResponseService: WsResponseService,
        private readonly eventEmitterService: EventEmitterService,
        private readonly winstonService: WinstonService,
    ) {}

    /** The namespace server instance used to emit to per-user rooms. */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * After the namespace is initialized, gate every socket behind Keycloak auth
     * so `socket.data.userId` (the keycloak sub) is set before any subscribe.
     */
    afterInit(): void {
        this.server.use(socketIoKeycloakAuthMiddleware)
    }

    /**
     * Join the authenticated caller to its own private notification room.
     *
     * The room is keyed by the internal UserEntity id (not the keycloak sub), so
     * we resolve the sub stamped on the socket to the user row first; the body
     * payload carries nothing the recipient could spoof.
     *
     * @param client - The subscribing socket (auth middleware set `data.userId`).
     */
    @SubscribeMessage(PublicationEvent.SubscribeNotifications)
    async handleSubscribeNotifications(
        @ConnectedSocket() client: TypedSocket,
    ): Promise<void> {
        try {
            // the auth middleware stamped the keycloak sub here; without it the
            // socket is unauthenticated and must not join any user room
            const keycloakId = client.data.userId
            if (!keycloakId) {
                this.wsResponseService.error({
                    client,
                    error: new Error("Unauthenticated socket"),
                    eventName: SubscriptionEvent.NotificationCreated,
                })
                return
            }
            // map keycloak sub -> internal user id (the room key the producer emits to)
            const user = await this.userService.getUserByKeycloakId(keycloakId)
            // join the per-user room; future creates for this user reach this socket
            await client.join(this.notificationRoomService.name(user.id))
        } catch (error) {
            // resolution failed (no user row / lookup error) -> surface a ws error
            // and log, but never crash the namespace for one bad socket
            this.winstonService.log(
                WinstonLog.RealtimeStreamFailed,
                {
                    op: "notifications.subscribe",
                    error: error instanceof Error ? error.message : String(error),
                    meta: {
                        socketId: client.id,
                    },
                },
            )
            this.wsResponseService.error({
                client,
                error: error instanceof Error ? error : new Error(String(error)),
                eventName: SubscriptionEvent.NotificationCreated,
            })
        }
    }

    /**
     * Wire the local event listener that forwards new notifications to the
     * recipient's private room.
     */
    onModuleInit(): void {
        // a notification was created -> push the snapshot to its recipient's room
        this.eventEmitterService.on({
            event: EventName.NotificationCreated,
            listener: (payload: NotificationCreatedEventPayload) => {
                this.wsResponseService.successToRoom<NotificationCreatedSocketIoMessage>({
                    message: "Notification created",
                    data: {
                        notification: payload.notification,
                    },
                    room: this.notificationRoomService.name(payload.userId),
                    namespace: this.server,
                    eventName: SubscriptionEvent.NotificationCreated,
                })
            },
        })
    }
}
