import {
    Injectable,
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
    In,
    IsNull,
    type EntityManager
} from "typeorm"
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
    InjectPrimaryPostgreSQLEntityManager,
    LoginSessionEntity,
    UserEntity
} from "@modules/databases"
import {
    EnqueueSendMailJobService
} from "@modules/bussiness"
import {
    enqueueLearnerEmail
} from "@modules/transactional-email"
import {
    LoginSessionNotFoundException,
    SessionSupersededException,
} from "@modules/exceptions"
import {
    SESSION_KEY_PREFIX
} from "./constants"
import {
    parseUserAgent,
    extractClientIp,
    resolveLocation
} from "./utils"
import type {
    AssertCurrentSessionParams,
    AssertCurrentSessionResult,
    EndSessionParams,
    EndSessionResult,
    ListSessionsParams,
    ListSessionsResult,
    MarkSessionRevokedParams,
    PersistSessionParams,
    RevokeSessionParams,
    RevokeSessionResult,
    SessionRecord,
    StartSessionParams,
    StartSessionResult
} from "./types"

/**
 * Enforces a per-account device limit (default 2) and tracks each login session
 * with its device, IP, and geo-location.
 *
 * The Redis hash `session:<keycloakSub>` is the source of truth for what is
 * currently active: each field is a `sessionId` → JSON {@link SessionRecord}. On
 * each login a fresh session is added; once the hash is full the oldest session
 * is evicted (its device fails its next guarded request). Every session is also
 * mirrored into the `login_sessions` Postgres table so the account can list and
 * revoke its devices, and so the history survives the Redis TTL.
 *
 * @example
 * await sessionService.startSession({ res, req, accessToken })
 * await sessionService.assertCurrent({ userId, sessionId })
 */
@Injectable()
export class SessionService {
    constructor(
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cookieService: CookieService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) { }

    /**
     * Starts a new device session, evicting the oldest session when the account
     * has reached its device limit.
     *
     * @param params - Response (for the cookie), request (for UA/IP), access token.
     * @returns void
     *
     * @example
     * await sessionService.startSession({ res: ctx.res, req: ctx.req, accessToken })
     */
    async startSession({ res, req, accessToken }: StartSessionParams): Promise<StartSessionResult> {
        // identify the user from the freshly-minted token's subject claim
        const userId = this.extractSubject(accessToken)
        // without a subject we cannot bind a session — skip silently
        if (!userId) {
            return
        }
        // derive the device facts from this request for display + audit
        const deviceInfo = parseUserAgent(req.headers["user-agent"])
        // resolve the client IP (needs Express `trust proxy`) and its location
        const ipAddress = extractClientIp(req)
        const location = resolveLocation(ipAddress)
        // mint an unguessable id for this specific session
        const sessionId = randomUUID()
        // single timestamp seeds both created/last-seen so they agree at login
        const now = Date.now()
        // assemble the record stored in Redis + mirrored to Postgres
        const record: SessionRecord = {
            sessionId,
            deviceType: deviceInfo.deviceType,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            ipAddress,
            location,
            createdAt: now,
            lastSeenAt: now,
        }
        const key = this.key(userId)
        // is this device new? compare its fingerprint against the currently-active
        // sessions BEFORE we add/evict, so a returning device never re-alerts.
        const existingSessions = await this.redis.hgetall(key)
        const isNewDevice = !Object.values(existingSessions).some((json) => {
            try {
                const prior = JSON.parse(json) as SessionRecord
                return (
                    prior.deviceType === record.deviceType &&
                    prior.os === record.os &&
                    prior.browser === record.browser
                )
            } catch {
                return false
            }
        })
        // make room first: drop the oldest session(s) when the account is full
        await this.evictOldestIfFull(userId)
        // add this session to the enforcement hash
        await this.redis.hset(
            key,
            sessionId,
            JSON.stringify(record),
        )
        // slide the whole-hash TTL forward on every login (matches refresh cookie)
        await this.redis.pexpire(
            key,
            envConfig().session.ttlMs,
        )
        // hand the id to this device as an HttpOnly cookie for later checks
        this.cookieService.attachHttpOnlyCookie({
            res,
            name: CookieName.SessionId,
            value: sessionId,
        })
        // mirror to Postgres so the device-management UI can list/revoke it
        await this.persistSession({
            keycloakId: userId,
            record,
        })

        // security alert: a sign-in from a device we have not seen before.
        // `userId` here is the Keycloak subject — resolve the local user row for
        // the email address. Best-effort: never let a mail failure break login.
        if (isNewDevice) {
            const user = await this.entityManager.findOne(
                UserEntity,
                {
                    where: {
                        keycloakId: userId,
                    },
                    select: {
                        id: true,
                    },
                },
            )
            if (user) {
                await enqueueLearnerEmail({
                    entityManager: this.entityManager,
                    enqueueSendMailJobService: this.enqueueSendMailJobService,
                    userId: user.id,
                    template: "new-device-signin",
                    webBaseUrl: envConfig().web.baseUrl,
                    subject: {
                        vi: "Có đăng nhập mới vào tài khoản của bạn",
                        en: "New sign-in to your account",
                    },
                    extraContext: {
                        deviceType: record.deviceType,
                        os: record.os,
                        browser: record.browser,
                        location: record.location,
                        ipAddress: record.ipAddress,
                    },
                })
            }
        }
    }

    /**
     * Rejects the request when the account has active sessions but the presented
     * one is not among them (it was evicted or revoked elsewhere). Fails open when
     * no session is stored so pre-existing tokens keep working until next login.
     *
     * @param params - The verified user id + the cookie-borne session id.
     * @returns void
     *
     * @example
     * await sessionService.assertCurrent({ userId: verified.sub, sessionId })
     */
    async assertCurrent({ userId, sessionId }: AssertCurrentSessionParams): Promise<AssertCurrentSessionResult> {
        const key = this.key(userId)
        // how many managed sessions the account currently has (heals legacy keys)
        const activeCount = await this.readActiveCount(key)
        // no managed session → nothing to enforce (rollout / expiry safety)
        if (activeCount === 0) {
            return
        }
        // managed sessions exist but this request carries no id → unmanaged device
        if (!sessionId) {
            throw new SessionSupersededException({
                userId,
            })
        }
        // the presented id must still be one of the account's active sessions
        const isActive = await this.redis.hexists(
            key,
            sessionId,
        )
        // not active → this device was evicted by a newer login or revoked
        if (!isActive) {
            throw new SessionSupersededException({
                userId,
            })
        }
    }

    /**
     * Ends only the current device's session on sign-out (other devices stay
     * logged in): clears the cookie, removes the Redis field, marks the row revoked.
     *
     * @param params - Response (clear cookie), request (read session cookie), refresh token.
     * @returns void
     *
     * @example
     * await sessionService.endSession({ res: ctx.res, req: ctx.req, refreshToken })
     */
    async endSession({ res, req, refreshToken }: EndSessionParams): Promise<EndSessionResult> {
        // read which device this is from its session cookie before clearing it
        const sessionId = this.cookieService.getCookie(req,
            CookieName.SessionId)
        // always drop this device's session cookie so it can no longer pass
        this.cookieService.clearCookie({
            res,
            name: CookieName.SessionId,
        })
        // identify the user from the refresh token's subject claim
        const userId = this.extractSubject(refreshToken)
        // remove only THIS session; a stale/absent id is harmless (TTL/no-op)
        if (userId && sessionId) {
            const key = this.key(userId)
            try {
                // drop from the enforcement hash so this device stops passing
                await this.redis.hdel(key,
                    sessionId)
            } catch (error) {
                // a legacy single-session string key breaks hdel with WRONGTYPE →
                // drop the whole key on sign-out (it was the only session anyway)
                if (this.isWrongTypeError(error)) {
                    await this.redis.del(key)
                } else {
                    throw error
                }
            }
            // stamp the persisted row revoked for history (best-effort)
            await this.markRevoked({
                keycloakId: userId,
                sessionId,
            })
        }
    }

    /**
     * Lists the account's currently-active login sessions for the device-management
     * UI. The Redis hash is the source of truth for "active"; the persisted rows
     * supply the richer device metadata.
     *
     * @param params - The owner's Keycloak id + the requesting device's session id.
     * @returns Active sessions ordered most-recently-seen first.
     *
     * @example
     * await sessionService.listSessions({ keycloakId: user.keycloakId, currentSessionId })
     */
    async listSessions({ keycloakId, currentSessionId }: ListSessionsParams): Promise<ListSessionsResult> {
        // the enforcement hash holds exactly the session ids that are still active
        const activeSessionIds = await this.readSessionIds(this.key(keycloakId))
        // no active sessions → empty list
        if (activeSessionIds.length === 0) {
            return []
        }
        // load the persisted rows for those active ids (skip any already revoked)
        const rows = await this.entityManager.find(
            LoginSessionEntity,
            {
                where: {
                    keycloakId,
                    sessionId: In(activeSessionIds),
                    revokedAt: IsNull(),
                },
                order: {
                    lastSeenAt: "DESC",
                },
            },
        )
        // project to the UI-facing shape, flagging which row is the caller's device
        return rows.map((row) => ({
            id: row.id,
            sessionId: row.sessionId,
            deviceType: row.deviceType,
            os: row.os,
            browser: row.browser,
            ipAddress: row.ipAddress,
            location: row.location,
            lastSeenAt: row.lastSeenAt,
            createdAt: row.createdAt,
            // the requesting device's cookie id marks the "this device" row
            current: row.sessionId === currentSessionId,
        }))
    }

    /**
     * Revokes one specific session of the account (e.g. "log out that device" from
     * the device-management UI). The targeted device fails its next guarded request.
     *
     * @param params - The owner's Keycloak id + the session id to revoke.
     * @returns void
     * @throws LoginSessionNotFoundException when the session is unknown or already revoked.
     *
     * @example
     * await sessionService.revokeSession({ keycloakId: user.keycloakId, sessionId })
     */
    async revokeSession({ keycloakId, sessionId }: RevokeSessionParams): Promise<RevokeSessionResult> {
        // locate the active persisted row; absence means nothing to revoke
        const row = await this.entityManager.findOne(
            LoginSessionEntity,
            {
                where: {
                    keycloakId,
                    sessionId,
                    revokedAt: IsNull(),
                },
            },
        )
        // unknown/already-revoked → typed error so callers can branch on the code
        if (!row) {
            throw new LoginSessionNotFoundException({
                keycloakId,
                sessionId,
            })
        }
        // drop from the enforcement hash so the device fails its next request
        await this.redis.hdel(
            this.key(keycloakId),
            sessionId,
        )
        // stamp the row revoked for history/UI
        row.revokedAt = new Date()
        await this.entityManager.save(row)
    }

    /**
     * Evicts the oldest session(s) when the account is at (or over) its device
     * limit, leaving exactly one free slot for the session about to be added.
     *
     * @param keycloakId - The Keycloak subject whose sessions to trim.
     * @returns void
     */
    private async evictOldestIfFull(keycloakId: string): Promise<void> {
        const key = this.key(keycloakId)
        // configured maximum number of concurrent devices per account
        const max = envConfig().session.maxDevices
        // snapshot every current session field → value (heals legacy keys)
        const all = await this.readSessionMap(key)
        const sessionIds = Object.keys(all)
        // still room for one more → no eviction needed
        if (sessionIds.length < max) {
            return
        }
        // map each field to its record; unparseable entries sort oldest (createdAt 0)
        const records = sessionIds.map((id) => this.parseRecord(all[id]) ?? {
            sessionId: id,
            deviceType: null,
            os: null,
            browser: null,
            ipAddress: null,
            location: null,
            createdAt: 0,
            lastSeenAt: 0,
        })
        // oldest-first so the first N are the ones to drop
        records.sort((prev, next) => prev.createdAt - next.createdAt)
        // drop enough so that, after adding one, the count equals `max`
        const dropCount = sessionIds.length - max + 1
        const toEvict = records.slice(0,
            dropCount)
        for (const evicted of toEvict) {
            // remove from the enforcement hash so that device stops passing
            await this.redis.hdel(
                key,
                evicted.sessionId,
            )
            // mark the persisted row revoked for history (best-effort)
            await this.markRevoked({
                keycloakId,
                sessionId: evicted.sessionId,
            })
        }
    }

    /**
     * Best-effort stamp of a persisted session row as revoked. A missing row
     * (e.g. an old session created before persistence existed) is harmless.
     *
     * @param params - The owner's Keycloak id + the session id to revoke.
     * @returns void
     */
    private async markRevoked({ keycloakId, sessionId }: MarkSessionRevokedParams): Promise<void> {
        // only touch a still-active row; already-revoked rows keep their timestamp
        await this.entityManager.update(
            LoginSessionEntity,
            {
                keycloakId,
                sessionId,
                revokedAt: IsNull(),
            },
            {
                revokedAt: new Date(),
            },
        )
    }

    /**
     * Persists a freshly-created session as a new `login_sessions` row.
     *
     * @param params - The owner's Keycloak id + the in-memory session record.
     * @returns void
     */
    private async persistSession({ keycloakId, record }: PersistSessionParams): Promise<void> {
        // build the row from the same record stored in Redis
        const row = this.entityManager.create(
            LoginSessionEntity,
            {
                keycloakId,
                sessionId: record.sessionId,
                deviceType: record.deviceType,
                os: record.os,
                browser: record.browser,
                ipAddress: record.ipAddress,
                location: record.location,
                // convert the epoch-ms timestamp back to a Date for the column
                lastSeenAt: new Date(record.lastSeenAt),
                revokedAt: null,
            },
        )
        await this.entityManager.save(row)
    }

    /**
     * Parses a stored Redis hash value back into a session record.
     *
     * @param raw - The JSON string stored in the hash field (may be undefined).
     * @returns The parsed record, or null when missing/corrupt.
     */
    private parseRecord(raw: string | undefined): SessionRecord | null {
        // missing field → nothing to parse
        if (!raw) {
            return null
        }
        try {
            // trusted source (our own writes), but guard against corruption
            return JSON.parse(raw) as SessionRecord
        } catch {
            // corrupt entry → treat as absent so callers can evict it
            return null
        }
    }

    /**
     * Reads the size of a user's session hash, healing the legacy single-session
     * string key from the pre-multi-device model. Such a key makes hash commands
     * fail with WRONGTYPE; we delete it and report zero so callers fail open and
     * the next login writes a fresh hash.
     *
     * @param key - The Redis key holding the user's sessions hash.
     * @returns The number of active sessions (0 when absent or healed).
     */
    private async readActiveCount(key: string): Promise<number> {
        try {
            // hash length; missing key returns 0 without throwing
            return await this.redis.hlen(key)
        } catch (error) {
            // legacy string key → drop it so the next login establishes a hash
            if (this.isWrongTypeError(error)) {
                await this.redis.del(key)
                return 0
            }
            throw error
        }
    }

    /**
     * Reads a user's full sessions hash, healing the legacy string key (see
     * {@link readActiveCount}).
     *
     * @param key - The Redis key holding the user's sessions hash.
     * @returns The field → record-JSON map (empty when absent or healed).
     */
    private async readSessionMap(key: string): Promise<Record<string, string>> {
        try {
            // missing key returns {} without throwing
            return await this.redis.hgetall(key)
        } catch (error) {
            // legacy string key → drop it and treat as no sessions
            if (this.isWrongTypeError(error)) {
                await this.redis.del(key)
                return {
                }
            }
            throw error
        }
    }

    /**
     * Reads a user's active session ids, healing the legacy string key (see
     * {@link readActiveCount}).
     *
     * @param key - The Redis key holding the user's sessions hash.
     * @returns The active session ids (empty when absent or healed).
     */
    private async readSessionIds(key: string): Promise<Array<string>> {
        try {
            // missing key returns [] without throwing
            return await this.redis.hkeys(key)
        } catch (error) {
            // legacy string key → drop it and treat as no sessions
            if (this.isWrongTypeError(error)) {
                await this.redis.del(key)
                return []
            }
            throw error
        }
    }

    /**
     * Detects the Redis WRONGTYPE error raised when a hash command hits the legacy
     * single-session string key left by the pre-multi-device model.
     *
     * @param error - The caught error from a Redis hash command.
     * @returns True when the error is a WRONGTYPE reply.
     */
    private isWrongTypeError(error: unknown): boolean {
        // ioredis surfaces the server reply text on the Error message
        return error instanceof Error && error.message.includes("WRONGTYPE")
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
     * Builds the Redis key holding a user's active sessions hash.
     *
     * @param userId - The Keycloak subject of the user.
     * @returns The namespaced Redis key.
     */
    private key(userId: string): string {
        // namespaced per-user key; one hash holds all that account's sessions
        return `${SESSION_KEY_PREFIX}${userId}`
    }
}
