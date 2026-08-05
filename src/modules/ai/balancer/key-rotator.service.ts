import {
    AiPingCacheService,
    isPingEntryEligible,
} from "@modules/cache"
import {
    Injectable,
} from "@nestjs/common"
import type {
    Redis,
} from "ioredis"
import {
    InjectIoRedis,
    IoRedisInstanceKey,
} from "@modules/native"
import {
    ModelProvider,
} from "@modules/databases"
import {
    NoActiveBalancerKeyException,
} from "@modules/exceptions"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    KeyState,
    NextKeyParams,
    NextKeyResult,
} from "./types"
import {
    KeyStoreService,
} from "./key-store.service"

/** Redis key prefix for the per-provider round-robin counter. */
const ROTATION_COUNTER_PREFIX = "ai_balancer:rotation:"

@Injectable()
/**
 * Picks the next eligible key from a provider pool using Redis round-robin.
 * Skips keys whose latest ping snapshot in Redis reports `status: false`.
 */
export class KeyRotatorService {
    constructor(
        private readonly keyStoreService: KeyStoreService,
        private readonly aiPingCacheService: AiPingCacheService,
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Pick the next eligible key for a provider.
     * @param params - Target provider.
     * @returns Key reference + eligible pool size at pick time.
     */
    async next({
        provider,
    }: NextKeyParams): Promise<NextKeyResult> {
        const pool = this.keyStoreService.getPool(provider)
        const providerCache = await this.aiPingCacheService.getProviderMap(provider)

        const now = new Date()
        const eligibleKeys = pool.filter(
            (key) => isPingEntryEligible(providerCache[key.value],
                now),
        )

        if (eligibleKeys.length === 0) {
            this.winstonService.log(
                WinstonLog.AiBalancerNoActiveKey,
                {
                    provider,
                    totalKeysCount: pool.length,
                },
            )
            throw new NoActiveBalancerKeyException({
                provider,
                totalKeysCount: pool.length,
            })
        }

        // health-weighted least-recently-used: prefer the key with the fewest
        // recent failures, then the one used longest ago (lastUsedAt persisted in
        // Redis → load spreads evenly across instances), keySuffix as a stable
        // tiebreak. Replaces the old global round-robin counter.
        const picked = [...eligibleKeys].sort((a, b) => {
            const entryA = providerCache[a.value]
            const entryB = providerCache[b.value]
            const failA = entryA?.failCount ?? 0
            const failB = entryB?.failCount ?? 0
            if (failA !== failB) {
                return failA - failB
            }
            const usedA = entryA?.lastUsedAt ? Date.parse(entryA.lastUsedAt) : 0
            const usedB = entryB?.lastUsedAt ? Date.parse(entryB.lastUsedAt) : 0
            if (usedA !== usedB) {
                return usedA - usedB
            }
            return a.keySuffix.localeCompare(b.keySuffix)
        })[0]
        picked.lastUsedAt = now
        // persist the pick time in Redis so LRU is shared across instances
        await this.aiPingCacheService.recordKeyPicked({
            provider,
            key: picked.value,
        })

        this.winstonService.log(
            WinstonLog.AiBalancerKeyPicked,
            {
                provider,
                keySuffix: picked.keySuffix,
                activeKeysCount: eligibleKeys.length,
            },
        )

        return {
            state: picked,
            activeKeysCount: eligibleKeys.length,
        }
    }

    /**
     * Reset the round-robin counter for a provider (e.g. after pool reload).
     * @param provider - Target provider.
     */
    async resetCounter(provider: ModelProvider): Promise<void> {
        await this.redis.del(this.counterKey(provider))
    }

    /**
     * Snapshot the current counter value (for admin debug).
     * @param provider - Target provider.
     * @returns Numeric counter — `0` when no rotation has happened yet.
     */
    async getCounter(provider: ModelProvider): Promise<number> {
        const raw = await this.redis.get(this.counterKey(provider))
        return raw ? parseInt(
            raw,
            10,
        ) : 0
    }

    /**
     * Find a key state by its suffix — used when reporting failure for a previously-picked key.
     * @param provider - Target provider.
     * @param keySuffix - Last 4 chars of the key value.
     */
    findBySuffix(
        provider: ModelProvider,
        keySuffix: string,
    ): KeyState | undefined {
        return this.keyStoreService.getPool(provider).find(
            (key) => key.keySuffix === keySuffix,
        )
    }

    /**
     * Build the Redis key used by `INCR` for a given provider.
     * @param provider - Target provider.
     */
    private counterKey(provider: ModelProvider): string {
        return `${ROTATION_COUNTER_PREFIX}${provider}`
    }
}
