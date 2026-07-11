/** Data attached to the socket (e.g. userId). */
export interface SocketData {
    /** The authenticated user id bound to this socket connection. */
    userId: string
    /**
     * `playground_sessions.id` this socket paired with via `agent:pair`. Only
     * set on `/playground_byom` agent sockets (which have no `userId` — that
     * namespace is unauthenticated, gated by pairing code instead).
     */
    sessionId?: string
}
