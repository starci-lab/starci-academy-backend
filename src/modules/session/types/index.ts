import type {
    Response
} from "express"

/** Params for starting (or replacing) a user's single active session. */
export interface StartSessionParams {
    /** The Express response to attach the new `session_id` cookie to. */
    res: Response
    /** A freshly-minted access token whose `sub` claim identifies the user. */
    accessToken: string
}

/** Result of starting a session (void). */
export type StartSessionResult = void

/** Params for asserting that a request belongs to the current active session. */
export interface AssertCurrentSessionParams {
    /** The Keycloak subject (user id) taken from the verified access token. */
    userId: string
    /** The session id presented by the request via the `session_id` cookie. */
    sessionId?: string
}

/** Result of the assertion (void; throws when the session is stale). */
export type AssertCurrentSessionResult = void

/** Params for ending a user's session (sign-out). */
export interface EndSessionParams {
    /** The Express response to clear the `session_id` cookie from. */
    res: Response
    /** The refresh token whose `sub` claim identifies the user to evict. */
    refreshToken: string
}

/** Result of ending a session (void). */
export type EndSessionResult = void
