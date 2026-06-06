import {
    ConnectedSocket, MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from "@nestjs/websockets"
import {
    Server, Socket,
} from "socket.io"
import {
    JoinDto, TypingDto,
} from "./dtos"
import {
    PresenceStoreService,
} from "./presence-store.service"
import type {
    JoinAck,
} from "./types"

/**
 * Socket.IO gateway for lesson `2-presence-and-typing-indicators`.
 *
 * Hosted on namespace `/8-websocket-realtime-communication/2-presence-and-typing-indicators`.
 * Tracks presence with multi-tab ref-counting: `user-joined` fires only on a
 * user's first tab and `user-left` only on their last, so opening a second tab
 * does not double-announce. `typing` is relayed to the room EXCEPT the sender to
 * avoid a self-echo.
 */
@WebSocketGateway({
    namespace: "/8-websocket-realtime-communication/2-presence-and-typing-indicators",
    cors: {
        origin: true,
    },
})
export class PresenceGateway implements OnGatewayDisconnect {
    /** The underlying Socket.IO namespace server, injected by Nest. */
    @WebSocketServer()
    private readonly server: Server

    constructor(private readonly store: PresenceStoreService) {}

    /**
     * Join a room: record the tab, announce on first tab, ack with the roster.
     */
    @SubscribeMessage("join")
    handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: JoinDto,
    ): JoinAck {
        // remember the identity on the socket so disconnect can clean up
        client.data.userId = body.userId
        client.data.roomId = body.roomId
        // add this socket to the Socket.IO room for targeted broadcasts
        void client.join(body.roomId)
        // record the tab and learn whether it is the user's first
        const { isFirstTab } = this.store.addTab(body.roomId, body.userId, client.id)
        // announce arrival to everyone else only when the user had no prior tab
        if (isFirstTab) {
            client.to(body.roomId).emit("user-joined", { userId: body.userId })
        }
        // ack the joiner with the current online roster
        return { ok: true, online: this.store.members(body.roomId) }
    }

    /**
     * Relay a typing indicator to the room, excluding the sender (no self-echo).
     */
    @SubscribeMessage("typing")
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: TypingDto,
    ): void {
        // `client.to(room)` targets the room minus the sender socket
        client.to(body.roomId).emit("typing", { userId: body.userId })
    }

    /**
     * On disconnect, drop the tab and announce departure only on the last tab.
     */
    handleDisconnect(client: Socket): void {
        // recover the identity recorded at join time
        const userId = client.data.userId as string | undefined
        const roomId = client.data.roomId as string | undefined
        // nothing to clean up if this socket never joined
        if (!userId || !roomId) return
        // drop the tab and learn whether it was the user's last
        const { isLastTab } = this.store.removeTab(roomId, userId, client.id)
        // announce departure to the room only when no tabs remain
        if (isLastTab) {
            this.server.to(roomId).emit("user-left", { userId })
        }
    }
}
