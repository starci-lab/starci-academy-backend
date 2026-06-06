/** A stored/broadcast chat message with a monotonic per-room sequence number. */
export interface ChatMessage {
    /** Per-room monotonic sequence number (starts at 1, never resets while alive). */
    seq: number
    /** Sender user id (taken from the socket's join identity). */
    userId: string
    /** Message text. */
    text: string
    /** Server timestamp in epoch milliseconds. */
    timestamp: number
}

/** Ack returned to a client that emits `join`. */
export interface JoinAck {
    /** Always true once the join is recorded. */
    ok: boolean
    /** The room's latest sequence number, so the client knows where it stands. */
    lastSeq: number
}

/** Ack returned to a client that emits `chat`. */
export interface ChatAck {
    /** Always true once the message is stored. */
    ok: boolean
    /** Sequence number assigned to the just-sent message. */
    seq: number
}

/** Ack returned to a client that emits `replay-since`. */
export interface ReplayAck {
    /** Messages with seq greater than the client's lastSeq, oldest first. */
    messages: Array<ChatMessage>
}
