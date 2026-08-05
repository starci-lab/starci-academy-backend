import type {
    Request,
    Response,
} from "express"

/** Device/browser facts derived from a request's `User-Agent` header. */
export interface DeviceInfo {
    /** Coarse device class, e.g. "desktop" | "mobile" | "tablet"; null when unknown. */
    deviceType: string | null
    /** Operating system name, e.g. "Windows" | "Mac OS" | "Android"; null when unknown. */
    os: string | null
    /** Browser name, e.g. "Chrome" | "Safari" | "Edge"; null when unknown. */
    browser: string | null
}

/**
 * The per-session record stored as one field of the Redis enforcement hash
 * `session:<keycloakSub>`. Serialized to JSON; timestamps are epoch milliseconds
 * so they survive the JSON round-trip without Date parsing.
 */
export interface SessionRecord {
    /** Unguessable id for this session; also the cookie value handed to the device. */
    sessionId: string
    /** Device class at login time; null when the user-agent was unparseable. */
    deviceType: string | null
    /** OS name at login time; null when unknown. */
    os: string | null
    /** Browser name at login time; null when unknown. */
    browser: string | null
    /** Client IP captured at login; null when it could not be determined. */
    ipAddress: string | null
    /** Human-readable location derived from the IP (e.g. "Ho Chi Minh City, VN"); null when unknown. */
    location: string | null
    /** Login timestamp (epoch ms); used to pick the oldest session when evicting. */
    createdAt: number
    /** Last-activity timestamp (epoch ms); seeded at login. */
    lastSeenAt: number
}

/** Params for starting (or adding) a device session for a user. */
export interface StartSessionParams {
    /** The Express response to attach the new `session_id` cookie to. */
    res: Response
    /** The incoming request -- source of the `User-Agent` header and client IP. */
    req: Request
    /** A freshly-minted access token whose `sub` claim identifies the user. */
    accessToken: string
}

/** Result of starting a session (void). */
export type StartSessionResult = void

/** Params for asserting that a request belongs to one of the user's active sessions. */
export interface AssertCurrentSessionParams {
    /** The Keycloak subject (user id) taken from the verified access token. */
    userId: string
    /** The session id presented by the request via the `session_id` cookie. */
    sessionId?: string
}

/** Result of the assertion (void; throws when the session is stale/evicted). */
export type AssertCurrentSessionResult = void

/** Params for ending the current device's session (sign-out). */
export interface EndSessionParams {
    /** The Express response to clear the `session_id` cookie from. */
    res: Response
    /** The incoming request -- source of the `session_id` cookie identifying which device to end. */
    req: Request
    /** The refresh token whose `sub` claim identifies the user. */
    refreshToken: string
}

/** Result of ending a session (void). */
export type EndSessionResult = void

/** Params for listing a user's currently-active login sessions. */
export interface ListSessionsParams {
    /** The Keycloak subject (user id) whose sessions to list. */
    keycloakId: string
    /** The session id of the requesting device, used to flag the "current" row. */
    currentSessionId?: string
}

/** A single active login session as surfaced to the device-management UI. */
export interface ListSessionEntry {
    /** Stable primary-key id of the persisted session row. */
    id: string
    /** The session id (cookie value) -- the handle the client passes to revoke. */
    sessionId: string
    /** Device class, e.g. "desktop"; null when unknown. */
    deviceType: string | null
    /** OS name, e.g. "Windows"; null when unknown. */
    os: string | null
    /** Browser name, e.g. "Chrome"; null when unknown. */
    browser: string | null
    /** Client IP captured at login; null when unknown. */
    ipAddress: string | null
    /** Human-readable location derived from the IP; null when unknown. */
    location: string | null
    /** Last-activity timestamp. */
    lastSeenAt: Date
    /** Login timestamp. */
    createdAt: Date
    /** True when this row is the session of the requesting device. */
    current: boolean
}

/** Result of listing sessions: active sessions ordered most-recent first. */
export type ListSessionsResult = Array<ListSessionEntry>

/** Params for revoking one specific session of a user. */
export interface RevokeSessionParams {
    /** The Keycloak subject (user id) that owns the session. */
    keycloakId: string
    /** The session id to revoke (forces that device to re-authenticate). */
    sessionId: string
}

/** Result of revoking a session (void; throws when the session does not exist). */
export type RevokeSessionResult = void

/** Params for the internal "mark a persisted session as revoked" helper. */
export interface MarkSessionRevokedParams {
    /** The Keycloak subject (user id) that owns the session. */
    keycloakId: string
    /** The session id whose persisted row should be stamped revoked. */
    sessionId: string
}

/** Params for the internal "persist a new session row" helper. */
export interface PersistSessionParams {
    /** The Keycloak subject (user id) the session belongs to. */
    keycloakId: string
    /** The freshly-created in-memory session record to mirror into Postgres. */
    record: SessionRecord
}
