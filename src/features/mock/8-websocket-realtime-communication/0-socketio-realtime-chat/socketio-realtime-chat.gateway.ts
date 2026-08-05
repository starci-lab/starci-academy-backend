import {
    ConnectedSocket, MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from "@nestjs/websockets"
import {
    Server, Socket,
} from "socket.io"
import {
    ChatToServerDto, JoinRoomDto,
} from "./dtos"
import type {
    ChatBroadcast, JoinAck,
} from "./types"

@WebSocketGateway({
    namespace: "/8-websocket-realtime-communication/0-socketio-realtime-chat",
    cors: {
        origin: true,
    },
})
/**
 * Socket.IO gateway for lesson `0-socketio-realtime-chat`.
 *
 * Implements the lesson's portable realtime-chat contract on its own namespace
 * `/8-websocket-realtime-communication/0-socketio-realtime-chat`:
 * `joinRoom { room, nickname }` joins a named room and acks; `chatToServer
 * { room, text }` broadcasts `chatToClient` to every member of that room
 * (including the sender). Join/leave produce `roomToClient` notifications. This
 * mirrors the real 4-language backend so the same Playwright specs pass against
 * either, and it backs both the web (single-client) and sandbox (two-tab) UIs.
 */
export class SocketioRealtimeChatGateway implements OnGatewayDisconnect {
    /** The underlying Socket.IO namespace server, injected by Nest. */
    @WebSocketServer()
    private readonly server: Server

    /**
     * Join (or switch) a room: record identity, subscribe to the room, notify
     * the other members, and ack the caller.
     */
    @SubscribeMessage("joinRoom")
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: JoinRoomDto,
    ): JoinAck {
        // leave a previously joined room so a client only belongs to one room
        const previous = client.data.room as string | undefined
        if (previous && previous !== body.room) void client.leave(previous)
        // remember identity for later message attribution + leave notices
        client.data.room = body.room
        client.data.nickname = body.nickname
        // subscribe this socket to the room's broadcasts
        void client.join(body.room)
        // notify the OTHER members that someone joined (sender excluded)
        client.to(body.room).emit("roomToClient",
            {
                nickname: body.nickname, event: "join" 
            })
        // ack the caller so the UI can show "room: <room>"
        return {
            ok: true, room: body.room, nickname: body.nickname 
        }
    }

    /**
     * Broadcast a chat message to every member of the room, including the sender.
     */
    @SubscribeMessage("chatToServer")
    handleChatToServer(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: ChatToServerDto,
    ): void {
        // derive the sender from the join identity (never trusted from the body)
        const nickname = (client.data.nickname as string | undefined) ?? "anon"
        // stamp a server-authoritative message (server owns createdAt)
        const message: ChatBroadcast = {
            nickname,
            text: body.text,
            room: body.room,
            createdAt: new Date().toISOString(),
        }
        // fan out to all members of the room (sender included → echo)
        this.server.to(body.room).emit("chatToClient",
            message)
    }

    /**
     * On disconnect, notify the room that the member left.
     */
    handleDisconnect(client: Socket): void {
        // recover the identity recorded at join time
        const room = client.data.room as string | undefined
        const nickname = client.data.nickname as string | undefined
        // nothing to announce if this socket never joined a room
        if (!room || !nickname) return
        // tell the remaining members someone left
        client.to(room).emit("roomToClient",
            {
                nickname, event: "leave" 
            })
    }
}
