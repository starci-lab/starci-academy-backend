/** Response body for `POST auth/register` and `POST auth/login`. */
export interface AuthAccessTokenResponse {
    /** The signed JWT the client attaches as a Socket.IO handshake auth token. */
    access_token: string
}

/** Decoded JWT payload the gateway stores on `socket.data.user`. */
export interface JwtUser {
    /** Stable numeric subject id assigned at register time. */
    sub: number
    /** Display name; the gateway uses this as the authoritative chat identity. */
    username: string
}

/** Payload of the `roomToClient` join acknowledgement's `data` field. */
export interface RoomJoinedAckData {
    /** The room the client just joined. */
    room: string
    /** Human-readable confirmation shown to the client. */
    message: string
}

/** Ack the `joinRoom` handler returns to the caller over Socket.IO. */
export interface RoomJoinedAck {
    /** Event name echoed back so a generic ack handler can dispatch on it. */
    event: string
    /** The join confirmation. */
    data: RoomJoinedAckData
}

/** A chat message broadcast on the `chatToClient` event. */
export interface SecureChatBroadcast {
    /** Message text echoed from the sender. */
    text: string
    /** Server-derived sender name (from the JWT, never the client body). */
    username: string
    /** Room the message belongs to. */
    room: string
    /** ISO-8601 timestamp stamped by the server. */
    at: string
}
