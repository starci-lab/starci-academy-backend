/** Decoded JWT payload the gateway stores on `socket.data.user`. */
export interface JwtUser {
    /** Stable numeric subject id assigned at register time. */
    sub: number
    /** Display name; the gateway uses this as the authoritative chat identity. */
    username: string
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
