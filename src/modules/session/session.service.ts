import {
    Injectable,
    UnauthorizedException
} from "@nestjs/common"
import {
    Redis
} from "ioredis"
import {
    decode
} from "jsonwebtoken"
import {
    randomUUID
} from "crypto"
import {
    InjectIoRedis,
    IoRedisInstanceKey
} from "@modules/native"
import {
    envConfig
} from "@modules/env"
import {
    CookieService,
    CookieName
} from "@modules/cookie"
import {
    SESSION_KEY_PREFIX
} from "./constants"
import type {
    AssertCurrentSessionParams,
    AssertCurrentSessionResult,
    EndSessionParams,
    EndSessionResult,
    StartSessionParams,
    StartSessionResult
} from "./types"

/**
 * Enforces a single account-wide session per user.
 *
 * On every login a fresh session id is minted, written to
 * `session:<sub>` in Redis (overwriting any previous value, which evicts the
 * other device), and handed to the client as an HttpOnly cookie. The auth
 * guard then rejects any authenticated request whose cookie no longer matches
 * the stored value.
 *
 * @example
 * await sessionService.startSession({ res, accessToken })
 * await sessionService.assertCurrent({ userId, sessionId })
 */
@Injectable()
export class SessionService {
    constructor(
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
        private readonly cookieService: CookieService,
    ) { }

    /**
     * Starts a new session, evicting any other active session for the user.
     *
     * @param params - Response to set the cookie on + the new access token.
     * @returns void
     *
     * @example
     * await sessionService.startSession({ res: ctx.res, accessToken })
     */
    async startSession({ res, accessToken }: StartSessionParams): Promise<StartSessionResult> {
        // identify the user from the freshly-minted token's subject claim
        const userId = this.extractSubject(accessToken)
        // without a subject we cannot bind a session — skip silently
        if (!userId) {
            return
        }
        // mint an unguessable id for this specific session
        const sessionId = randomUUID()
        // overwrite the user's session record; any prior device is now stale
        await this.redis.set(
            this.key(userId),
            sessionId,
            "PX",
            envConfig().session.ttlMs,
        )
        // hand the id to this device as an HttpOnly cookie for later checks
        this.cookieService.attachHttpOnlyCookie({
            res,
            name: CookieName.SessionId,
            value: sessionId,
        })
    }

    /**
     * Rejects the request when the user has an active session that differs
     * from the one presented. Fails open when no session is stored so that
     * pre-existing tokens (issued before this feature) keep working until the
     * next login establishes a managed session.
     *
     * @param params - The verified user id + the cookie-borne session id.
     * @returns void
     *
     * @example
     * await sessionService.assertCurrent({ userId: verified.sub, sessionId })
     */
    async assertCurrent({ userId, sessionId }: AssertCurrentSessionParams): Promise<AssertCurrentSessionResult> {
        // look up the currently-valid session id for this user
        const current = await this.redis.get(this.key(userId))
        // no managed session → nothing to enforce (rollout / expiry safety)
        if (!current) {
            return
        }
        // a managed session exists but this request carries the wrong/no id →
        // it belongs to a device that has been logged out by a newer login
        if (sessionId !== current) {
            throw new UnauthorizedException("Session has been superseded by a newer login")
        }
    }

    /**
     * Ends the user's session on sign-out: clears the cookie and best-effort
     * deletes the Redis record (decoded from the refresh token's subject).
     *
     * @param params - Response to clear the cookie on + the refresh token.
     * @returns void
     *
     * @example
     * await sessionService.endSession({ res: ctx.res, refreshToken })
     */
    async endSession({ res, refreshToken }: EndSessionParams): Promise<EndSessionResult> {
        // always drop this device's session cookie so it can no longer pass
        this.cookieService.clearCookie({
            res,
            name: CookieName.SessionId,
        })
        // best-effort: remove the Redis record if we can read the subject
        const userId = this.extractSubject(refreshToken)
        // a stale record (when decode fails) is harmless — it expires via TTL
        if (userId) {
            await this.redis.del(this.key(userId))
        }
    }

    /**
     * Decodes a JWT (without signature verification) to read its `sub` claim.
     * Safe here because the tokens come straight from our own Keycloak.
     *
     * @param token - The access or refresh token to inspect.
     * @returns The subject (user id), or undefined when not decodable.
     */
    private extractSubject(token: string): string | undefined {
        // decode-only: we just need the subject, signature is trusted at source
        const payload = decode(token)
        // opaque/invalid tokens decode to null or a bare string → no subject
        if (!payload || typeof payload === "string") {
            return undefined
        }
        // sub may be absent on malformed tokens; normalise to string|undefined
        return typeof payload.sub === "string" ? payload.sub : undefined
    }

    /**
     * Builds the Redis key holding a user's active session id.
     *
     * @param userId - The Keycloak subject of the user.
     * @returns The namespaced Redis key.
     */
    private key(userId: string): string {
        // namespaced per-user key so each account has exactly one active session
        return `${SESSION_KEY_PREFIX}${userId}`
    }
}
