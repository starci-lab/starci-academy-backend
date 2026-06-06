import {
    ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from "@nestjs/websockets"
import {
    Server, Socket,
} from "socket.io"
import {
    ChatDto, JoinDto, ReplaySinceDto,
} from "./dtos"
import {
    ReconnectionStoreService,
} from "./reconnection-store.service"
import type {
    ChatAck, JoinAck, ReplayAck,
} from "./types"

/**
 * Socket.IO gateway for lesson `3-reconnection-and-missed-messages`.
 *
 * Hosted on namespace `/8-websocket-realtime-communication/3-reconnection-and-missed-messages`.
 * Every message gets a monotonic per-room seq and lands in a ring buffer. A
 * client that drops and reconnects emits `replay-since` with its last seen seq
 * and the server returns exactly the messages it missed — no auth, this lesson
 * is purely about reconnection + replay.
 */
@WebSocketGateway({
    namespace: "/8-websocket-realtime-communication/3-reconnection-and-missed-messages",
    cors: {
        origin: true,
    },
})
export class ReconnectionGateway {
    /** The underlying Socket.IO namespace server, injected by Nest. */
    @WebSocketServer()
    private readonly server: Server

    constructor(private readonly store: ReconnectionStoreService) {}

    /**
     * Join a room: record identity, subscribe to broadcasts, ack the latest seq.
     */
    @SubscribeMessage("join")
    handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: JoinDto,
    ): JoinAck {
        // remember identity so `chat` can attribute messages without trusting the body
        client.data.userId = body.userId
        client.data.roomId = body.roomId
        // subscribe this socket to the room's broadcasts
        void client.join(body.roomId)
        // tell the client where the room currently stands
        return { ok: true, lastSeq: this.store.lastSeq(body.roomId) }
    }

    /**
     * Store and broadcast a chat message, acking the assigned seq to the sender.
     */
    @SubscribeMessage("chat")
    handleChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: ChatDto,
    ): ChatAck {
        // derive the sender from the join identity (fallback for safety)
        const userId = (client.data.userId as string | undefined) ?? "anon"
        // append to the ring buffer, which assigns the next seq + timestamp
        const message = this.store.append(body.roomId, userId, body.text)
        // broadcast the stored message to everyone in the room (sender included)
        this.server.to(body.roomId).emit("chat", message)
        // ack the sender with the seq so it can advance its lastSeq cursor
        return { ok: true, seq: message.seq }
    }

    /**
     * Replay the messages a reconnecting client missed since `lastSeq`.
     */
    @SubscribeMessage("replay-since")
    handleReplaySince(
        @MessageBody() body: ReplaySinceDto,
    ): ReplayAck {
        // pull the capped slice of messages newer than the client's cursor
        return { messages: this.store.replaySince(body.roomId, body.lastSeq) }
    }
}
