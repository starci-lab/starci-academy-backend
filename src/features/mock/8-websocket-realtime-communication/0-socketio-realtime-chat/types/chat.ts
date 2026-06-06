/** Ack returned to a client that emits `joinRoom`. */
export interface JoinAck {
    /** Always true once the join is recorded. */
    ok: boolean
    /** The room that was joined. */
    room: string
    /** The nickname recorded for this client. */
    nickname: string
}

/** A chat message broadcast on the `chatToClient` event. */
export interface ChatBroadcast {
    /** Server-derived sender nickname (from the join identity). */
    nickname: string
    /** Message text. */
    text: string
    /** Room the message belongs to. */
    room: string
    /** ISO-8601 timestamp stamped by the server. */
    createdAt: string
}

/** Room membership notification on the `roomToClient` event. */
export interface RoomEvent {
    /** The nickname that joined or left. */
    nickname: string
    /** Which membership change occurred. */
    event: "join" | "leave"
}
