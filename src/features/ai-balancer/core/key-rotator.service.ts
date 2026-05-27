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
import {
    KeyStatus,
} from "../enums"
import type {
    KeyState,
    NextKeyParams,
    NextKeyResult,
} from "../types"
import {
    KeyStoreService,
} from "./key-store.service"

/** Redis key prefix for the per-provider round-robin counter. */
const ROTATION_COUNTER_PREFIX = "ai_balancer:rotation:"

/**
 * Picks the next active key from a provider's pool using a round-robin
 * counter held in Redis (Valkey) so multiple app instances rotate against
 * the same sequence without colliding on the same key.
 *
 * The counter is incremented with `INCR` on every pick — eventually it wraps
 * naturally well past `Number.MAX_SAFE_INTEGER` because pick uses
 * `counter % activeKeys.length` modulo.
 *
 * @example
 * const { state } = await rotator.next({ provider: ModelProvider.OpenAI })
 * const client = new ChatOpenAI({ apiKey: state.value })
 */
@Injectable()
export class KeyRotatorService {
    constructor(
        private readonly keyStoreService: KeyStoreService,
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Pick the next active key for a provider.
     *
     * @param params - target provider
     * @returns Key reference + active pool size at pick time
     * @throws NoActiveBalancerKeyException when every key is disabled / pool empty
     */
    async next({
        provider,
    }: NextKeyParams): Promise<NextKeyResult> {
        // grab the live pool
        const pool = this.keyStoreService.getPool(provider)

        // filter to active keys only
        const activeKeys = pool.filter((key) => key.status === KeyStatus.Active)
        if (activeKeys.length === 0) {
            // log + throw — caller decides whether to fall back to disk-cached key
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

        // atomic round-robin counter shared across app instances
        const counter = await this.redis.incr(this.counterKey(provider))

        // modulo into the active key window
        const index = (counter - 1) % activeKeys.length
        const picked = activeKeys[index]

        // stamp the pick time on the live reference (non-blocking, fire-and-forget mutation)
        picked.lastUsedAt = new Date()

        // debug log
        this.winstonService.log(
            WinstonLog.AiBalancerKeyPicked,
            {
                provider,
                keySuffix: picked.keySuffix,
                activeKeysCount: activeKeys.length,
            },
        )

        return {
            state: picked,
            activeKeysCount: activeKeys.length,
        }
    }

    /**
     * Reset the round-robin counter for a provider (e.g. after pool reload).
     *
     * @param provider - target provider
     */
    async resetCounter(provider: ModelProvider): Promise<void> {
        await this.redis.del(this.counterKey(provider))
    }

    /**
     * Snapshot the current counter value (for admin debug).
     *
     * @param provider - target provider
     * @returns Numeric counter — `0` when no rotation has happened yet
     */
    async getCounter(provider: ModelProvider): Promise<number> {
        const raw = await this.redis.get(this.counterKey(provider))
        return raw ? parseInt(
            raw,
            10,
        ) : 0
    }

    /**
     * Build the Redis key used by `INCR` for a given provider.
     */
    private counterKey(provider: ModelProvider): string {
        return `${ROTATION_COUNTER_PREFIX}${provider}`
    }

    /**
     * Public helper to find a key state by its suffix — used by the health
     * service / balancer when reporting failure for a previously-picked key.
     *
     * @param provider - target provider
     * @param keySuffix - last 4 chars of the key value
     */
    findBySuffix(
        provider: ModelProvider,
        keySuffix: string,
    ): KeyState | undefined {
        return this.keyStoreService.getPool(provider).find(
            (key) => key.keySuffix === keySuffix,
        )
    }
}
