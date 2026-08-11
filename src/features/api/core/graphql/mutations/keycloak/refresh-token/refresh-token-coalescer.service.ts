import {
    Injectable,
} from "@nestjs/common"
import {
    Redis,
} from "ioredis"
import {
    createHash,
    randomUUID,
} from "crypto"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    InjectIoRedis,
} from "@modules/lib/native/ioredis/ioredis.decorators"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    REFRESH_LOCK_KEY_PREFIX,
    REFRESH_LOCK_TTL_MS,
    REFRESH_POLL_INTERVAL_MS,
    REFRESH_RESULT_KEY_PREFIX,
    REFRESH_RESULT_TTL_MS,
    REFRESH_WAIT_TIMEOUT_MS,
} from "./constants"
import type {
    ExchangeAndPublishParams,
    ExchangeRefreshTokenParams,
    ExchangeRefreshTokenResult,
} from "./types"
import {
    RefreshTokenExchangeTimeoutException,
} from "@modules/platform/exceptions/errors/keycloak/refresh-token-exchange-timeout"

@Injectable()
/**
 * Coalesces concurrent refresh-token exchanges across all app instances.
 *
 * Keycloak rotates the refresh token on every exchange, so a client that fires
 * several refreshes at once (e.g. multiple queries hitting a 401 together)
 * would have all but the first call present an already-consumed token and fail.
 * This service elects a single caller per distinct token to hit Keycloak (via a
 * Redis `SET NX` lock) and shares its fresh token set with the others through a
 * short-lived Redis result cache -- so a burst yields one round-trip and one
 * consistent rotated pair.
 *
 * @example
 * const tokens = await coalescer.exchange({ refreshToken })
 */
export class RefreshTokenCoalescerService {
    /** Never let an expired leader delete a lock acquired by its successor. */
    private readonly releaseLockScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
end
return 0
`

    constructor(
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
        private readonly keycloakTokenService: KeycloakTokenService,
    ) { }

    /**
     * Exchanges a refresh token for a fresh Keycloak token set, deduplicating
     * concurrent calls that present the same token.
     *
     * @param params - The current refresh token to exchange.
     * @returns The fresh Keycloak token set (own exchange or a shared one).
     *
     * @example
     * await coalescer.exchange({ refreshToken })
     */
    async exchange(
        { refreshToken }: ExchangeRefreshTokenParams,
    ): Promise<ExchangeRefreshTokenResult> {
        // derive a fixed-length, non-reversible key from the token so the raw
        // refresh token is never used as (or stored in) a Redis key
        const fingerprint = createHash("sha256")
            .update(refreshToken)
            .digest("hex")
        const resultKey = `${REFRESH_RESULT_KEY_PREFIX}${fingerprint}`
        const lockKey = `${REFRESH_LOCK_KEY_PREFIX}${fingerprint}`

        // fast path: a concurrent caller already exchanged this exact token
        const cached = await this.readResult(resultKey)
        if (cached) {
            return cached
        }

        const deadline = Date.now() + REFRESH_WAIT_TIMEOUT_MS
        while (Date.now() < deadline) {
            const lockOwner = randomUUID()
            const acquired = await this.redis.set(
                lockKey,
                lockOwner,
                "PX",
                REFRESH_LOCK_TTL_MS,
                "NX",
            )
            if (acquired) {
                return this.exchangeAndPublish({
                    refreshToken,
                    resultKey,
                    lockKey,
                    lockOwner,
                })
            }

            // A failed leader releases its lock without publishing. Waiters then
            // re-enter election; they must never bypass the lock and rotate the
            // same refresh token in parallel.
            const coalesced = await this.awaitResultOrUnlock(
                resultKey,
                lockKey,
                deadline,
            )
            if (coalesced) {
                return coalesced
            }
        }

        throw new RefreshTokenExchangeTimeoutException({
        })
    }

    /**
     * Performs the Keycloak exchange while holding the lock and publishes the
     * result so coalesced waiters can read it. Always releases the lock.
     *
     * @param params - Refresh token plus the result/lock Redis keys.
     * @returns The fresh Keycloak token set.
     */
    private async exchangeAndPublish(
        {
            refreshToken,
            resultKey,
            lockKey,
            lockOwner,
        }: ExchangeAndPublishParams,
    ): Promise<ExchangeRefreshTokenResult> {
        try {
            const token = await this.keycloakTokenService.exchangeRefreshTokenForToken({
                refreshToken,
            })
            // publish for the burst window so near-concurrent callers reuse it
            await this.redis.set(
                resultKey,
                JSON.stringify(token),
                "PX",
                REFRESH_RESULT_TTL_MS,
            )
            return token
        } finally {
            // release early so a later, legitimate refresh of a NEW token (whose
            // fingerprint differs) is never blocked by this lock's full TTL
            await this.redis.eval(
                this.releaseLockScript,
                1,
                lockKey,
                lockOwner,
            )
        }
    }

    /**
     * Reads and deserializes a published exchange result, if present.
     *
     * @param resultKey - The Redis key holding the serialized token set.
     * @returns The token set, or undefined when not yet published.
     */
    private async readResult(
        resultKey: string,
    ): Promise<ExchangeRefreshTokenResult | undefined> {
        const raw = await this.redis.get(resultKey)
        if (!raw) {
            return undefined
        }
        return JSON.parse(raw) as ExchangeRefreshTokenResult
    }

    /**
     * Polls for the lock holder's published result until it appears or the wait
     * budget is exhausted.
     *
     * @param resultKey - The Redis key the holder publishes its result to.
     * @returns The token set once available, or undefined on timeout.
     */
    private async awaitResultOrUnlock(
        resultKey: string,
        lockKey: string,
        deadline: number,
    ): Promise<ExchangeRefreshTokenResult | undefined> {
        while (Date.now() < deadline) {
            await this.sleep(REFRESH_POLL_INTERVAL_MS)
            const result = await this.readResult(resultKey)
            if (result) {
                return result
            }
            if (await this.redis.exists(lockKey) === 0) {
                return undefined
            }
        }
        return undefined
    }

    /**
     * Resolves after the given delay.
     *
     * @param ms - Delay in milliseconds.
     * @returns A promise that resolves once the delay elapses.
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve,
            ms))
    }
}
