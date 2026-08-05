/** Data attached to the socket (e.g. userId). */
export interface SocketData {
    /** The authenticated user id bound to this socket connection. */
    userId: string
    /**
     * `playground_sessions.id` this socket paired with via `agent:pair`. Only
     * set on `/playground_byom` agent sockets (which have no `userId` -- that
     * namespace is unauthenticated, gated by pairing code instead).
     */
    sessionId?: string
    /**
     * `playground_sessions.id` this BROWSER socket was verified to OWN (its
     * Keycloak `sub` matches the session's user) on `browser:subscribe`. Gates
     * `command:run`: only the owner browser may push commands to the paired
     * agent -- a paired agent (or any other socket) can NOT, closing the
     * "guess the pairing code -> relay a command -> run it on the learner's
     * machine" (RCE) path. Distinct from {@link sessionId}, which agents set.
     */
    ownedSessionId?: string
}
