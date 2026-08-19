/** Response body for `GET presence/:room`. */
export interface PresenceSnapshotResponse {
    /** Current distinct user ids present in the room. */
    members: Array<string>
}

/** Ack returned to a client that emits `join`. */
export interface JoinAck {
    /** Always true once the join is recorded. */
    ok: boolean
    /** Current distinct user ids present in the room. */
    online: Array<string>
}

/** Payload for the `user-joined` / `user-left` broadcasts. */
export interface UserPresenceEvent {
    /** The user id that joined or left. */
    userId: string
}

/** Payload relayed on the `typing` broadcast. */
export interface TypingEvent {
    /** The user id that is currently typing. */
    userId: string
}
