import {
    Logger,
    OnModuleInit,
} from "@nestjs/common"
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
    WsResponseService,
    socketIoKeycloakAuthMiddleware,
} from "@modules/socketio"
import type {
    TypedSocket,
} from "@modules/socketio"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import type {
    NotificationCreatedEventPayload,
} from "@modules/event"
import {
    UserService,
} from "@modules/bussiness"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../enums"
import {
    NotificationRoomService,
} from "./notification-room.service"
import type {
    NotificationCreatedSocketIoMessage,
} from "./types"

@NotificationsWebSocketGateway()
/**
 * WebSocket gateway for the `/notifications` namespace — per-user bell realtime.
 *
 * A client connects with its Keycloak access token (verified by the auth
 * middleware, which stamps `socket.data.userId` with the keycloak `sub`), then
 * subscribes. The handler resolves the keycloak sub to the internal
 * {@link UserEntity} id and joins the caller to its OWN private room
 * (`notifications:{userId}`) — so a client can never receive another user's
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
    ) {}

    /** The namespace server instance used to emit to per-user rooms. */
    @WebSocketServer()
    private readonly server: Namespace

    /** Logger for subscribe-time failures that cannot reach the client cleanly. */
    private readonly logger = new Logger(NotificationsGateway.name)

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
            // map keycloak sub → internal user id (the room key the producer emits to)
            const user = await this.userService.getUserByKeycloakId(keycloakId)
            // join the per-user room; future creates for this user reach this socket
            await client.join(this.notificationRoomService.name(user.id))
        } catch (error) {
            // resolution failed (no user row / lookup error) → surface a ws error
            // and log, but never crash the namespace for one bad socket
            this.logger.error(
                `failed to subscribe socket to notifications: ${
                    error instanceof Error ? error.message : String(error)
                }`,
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
        // a notification was created → push the snapshot to its recipient's room
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
