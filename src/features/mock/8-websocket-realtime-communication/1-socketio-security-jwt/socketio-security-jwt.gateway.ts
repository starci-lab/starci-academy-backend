import {
    ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from "@nestjs/websockets"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    Server, Socket,
} from "socket.io"
import {
    ChatToServerDto,
    JoinRoomDto,
} from "./dtos/chat"
import type {
    JwtUser,
    SecureChatBroadcast,
} from "./types/auth"

@WebSocketGateway({
    namespace: "/8-websocket-realtime-communication/1-socketio-security-jwt",
    cors: {
        origin: true,
    },
})
/**
 * Socket.IO gateway for lesson `1-socketio-security-jwt`.
 *
 * Authenticates every connection at the handshake via a namespace middleware
 * (`server.use`): the JWT is read from `handshake.auth.token`, then the
 * `Authorization: Bearer` header, then `?token=`. A missing or invalid token is
 * rejected before any `@SubscribeMessage` handler can run. The chat identity is
 * always derived from the verified token (`socket.data.user`), never from the
 * client-supplied message body -- that is the core security invariant.
 */
export class SocketioSecurityJwtGateway implements OnGatewayInit {
    /** The underlying Socket.IO namespace server, injected by Nest. */
    @WebSocketServer()
    private readonly server: Server

    constructor(private readonly jwt: JwtService) {}

    /**
     * Register the auth middleware once the namespace server is ready. The
     * middleware runs during the handshake, so rejection happens before connect.
     */
    afterInit(server: Server): void {
        // gate every incoming connection on a valid JWT
        server.use((socket, next) => {
            // pull the token from the supported locations in priority order
            const token = this.extractToken(socket)
            // no token at all -> reject the handshake (message matches the spec)
            if (!token) {
                next(new Error("Unauthorized: missing token"))
                return
            }
            try {
                // verify signature + expiry; throws on any failure
                const payload = this.jwt.verify<JwtUser>(token)
                // stash the verified identity for later message handlers
                socket.data.user = {
                    sub: payload.sub, username: payload.username 
                }
                // allow the connection through
                next()
            } catch {
                // invalid/expired token -> reject the handshake (message matches the spec)
                next(new Error("Unauthorized: invalid token"))
            }
        })
    }

    /**
     * Join the requested room and acknowledge the client.
     */
    @SubscribeMessage("joinRoom")
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: JoinRoomDto,
    ): { event: string; data: { room: string; message: string } } {
        // add this socket to the room so it receives that room's broadcasts
        void client.join(body.room)
        // acknowledge the join back to the caller
        return {
            event: "roomToClient",
            data: {
                room: body.room, message: `You joined room ${body.room}` 
            },
        }
    }

    /**
     * Broadcast a chat message to the room with a server-derived username.
     */
    @SubscribeMessage("chatToServer")
    handleChatToServer(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: ChatToServerDto,
    ): void {
        // read the authoritative identity set by the auth middleware
        const user = client.data.user as JwtUser | undefined
        // defensive: without an identity there is nothing to attribute the message to
        if (!user) return
        // build the broadcast payload -- username comes from the JWT, not the body
        const payload: SecureChatBroadcast = {
            text: body.text,
            username: user.username,
            room: body.room,
            at: new Date().toISOString(),
        }
        // fan the message out to everyone in the room (sender included)
        this.server.to(body.room).emit("chatToClient",
            payload)
    }

    /**
     * Extract the JWT from the handshake, honoring the documented priority:
     * `auth.token` -> `Authorization: Bearer` header -> `?token=` query.
     */
    private extractToken(socket: Socket): string | null {
        // priority 1: Socket.IO auth field
        const authToken = socket.handshake.auth?.token
        if (typeof authToken === "string" && authToken.length > 0) return authToken
        // priority 2: Authorization Bearer header
        const header = socket.handshake.headers.authorization
        if (typeof header === "string" && header.startsWith("Bearer ")) {
            return header.slice("Bearer ".length)
        }
        // priority 3: query string fallback for plain browser clients
        const queryToken = socket.handshake.query.token
        if (typeof queryToken === "string" && queryToken.length > 0) return queryToken
        // nothing found
        return null
    }
}
