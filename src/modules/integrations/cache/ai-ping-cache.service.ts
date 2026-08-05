import {
    ModelProvider,
} from "@modules/databases"
import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    CacheService,
} from "./cache.service"
import {
    CacheKey,
} from "./enums"
import type {
    AiPingKeyStatusMap,
    ProviderPingKeyStatusMap,
    RecordKeyCooldownParams,
    RecordKeyPickedParams,
    RecordKeySuccessParams,
    RecordPingKeyStatusParams,
} from "./types"
import {
    DayjsService 
} from "@modules/mixin"

/**
 * Redis-backed store for AI mount-key ping snapshots.
 *
 * Shape: `Record<provider, Record<apiKey, { status, lastPing }>>`.
 * TTL is configured as effectively infinite via {@link CacheKey.AiPingKeyStatus}.
 */
@Injectable()
export class AiPingCacheService implements OnModuleInit {
    /** Cooldown (ms) for a failed background ping / generic transient failure. */
    private static readonly PING_FAIL_COOLDOWN_MS = 30_000
    /** Effective cooldown (ms) for a hard-disabled key (≈ until next reload). */
    private static readonly DISABLED_COOLDOWN_MS = 24 * 60 * 60 * 1000

    constructor(
        private readonly cacheService: CacheService,
        private readonly dayjsService: DayjsService,
    ) { }

    /**
     * Seed an empty map in Redis when the key does not exist yet.
     */
    async onModuleInit(): Promise<void> {
        await this.getOrCreateMap()
    }

    /**
     * Persist the outcome of one ping attempt for a provider key.
     * @param params - Provider, raw key, and whether the ping succeeded.
     */
    async recordPingKeyStatus({
        provider,
        key,
        success,
    }: RecordPingKeyStatusParams): Promise<void> {
        if (success) {
            await this.recordKeySuccess({
                provider,
                key,
            })
            return
        }
        // a failed background ping = short transient cooldown (self-heals)
        await this.recordKeyCooldown({
            provider,
            key,
            cooldownMs: AiPingCacheService.PING_FAIL_COOLDOWN_MS,
        })
    }

    /**
     * Mark a key healthy again: status true, with cooldown / disabled / failCount
     * all cleared. Called on a successful call or ping.
     */
    async recordKeySuccess({
        provider,
        key,
    }: RecordKeySuccessParams): Promise<void> {
        const map = await this.getOrCreateMap()
        const providerMap = map[provider] ?? {
        }
        providerMap[key] = {
            status: true,
            lastPing: this.dayjsService.now().toISOString(),
            // keep the LRU stamp; success clears health, not pick history
            lastUsedAt: providerMap[key]?.lastUsedAt,
        }
        map[provider] = providerMap
        await this.cacheService.set({
            key: CacheKey.AiPingKeyStatus,
            cacheResult: map,
        })
    }

    /**
     * Put a key on cooldown (or hard-disable) after a classified failure. While
     * on cooldown the key is ineligible ({@link isEligible}) and auto-recovers
     * once the window passes; `disabled` keeps it out until the pool reloads.
     */
    async recordKeyCooldown({
        provider,
        key,
        cooldownMs,
        disabled,
    }: RecordKeyCooldownParams): Promise<void> {
        const map = await this.getOrCreateMap()
        const providerMap = map[provider] ?? {
        }
        const previous = providerMap[key]
        const now = this.dayjsService.now()
        const effectiveMs = disabled
            ? AiPingCacheService.DISABLED_COOLDOWN_MS
            : cooldownMs
        providerMap[key] = {
            status: false,
            lastPing: now.toISOString(),
            failCount: (previous?.failCount ?? 0) + 1,
            cooldownUntil: now.add(effectiveMs, "millisecond").toISOString(),
            disabled: disabled ?? previous?.disabled,
            lastUsedAt: previous?.lastUsedAt,
        }
        map[provider] = providerMap
        await this.cacheService.set({
            key: CacheKey.AiPingKeyStatus,
            cacheResult: map,
        })
    }

    /**
     * Stamp a key as just-picked — updates only `lastUsedAt`, preserving health
     * (cooldown / disabled / failCount). Persisting the pick time in Redis lets
     * the rotator spread load least-recently-used across every instance (the C/D
     * of the balancer rotation design).
     */
    async recordKeyPicked({
        provider,
        key,
    }: RecordKeyPickedParams): Promise<void> {
        const map = await this.getOrCreateMap()
        const providerMap = map[provider] ?? {
        }
        const previous = providerMap[key]
        const now = this.dayjsService.now().toISOString()
        providerMap[key] = {
            status: previous?.status ?? true,
            lastPing: previous?.lastPing ?? now,
            cooldownUntil: previous?.cooldownUntil,
            failCount: previous?.failCount,
            disabled: previous?.disabled,
            lastUsedAt: now,
        }
        map[provider] = providerMap
        await this.cacheService.set({
            key: CacheKey.AiPingKeyStatus,
            cacheResult: map,
        })
    }


    /**
     * Read the full provider → key → status map from Redis.
     * @returns Cached ping snapshots for every provider that has been probed.
     */
    async getMap(): Promise<AiPingKeyStatusMap> {
        return this.getOrCreateMap()
    }

    /**
     * Read ping snapshots for one provider.
     * @param provider - Target {@link ModelProvider}.
     * @returns Key → snapshot map, or an empty object when the provider has no entries.
     */
    async getProviderMap(
        provider: ModelProvider,
    ): Promise<ProviderPingKeyStatusMap> {
        const map = await this.getOrCreateMap()
        return map[provider] ?? {
        }
    }

    /**
     * Load the map from Redis, creating an empty payload when missing.
     * @returns The cached map (possibly newly initialized).
     */
    private async getOrCreateMap(): Promise<AiPingKeyStatusMap> {
        const existing = await this.cacheService.get({
            key: CacheKey.AiPingKeyStatus,
        })
        if (existing !== undefined) {
            return existing
        }
        const empty: AiPingKeyStatusMap = {
        }
        await this.cacheService.set({
            key: CacheKey.AiPingKeyStatus,
            cacheResult: empty,
        })
        return empty
    }
}
