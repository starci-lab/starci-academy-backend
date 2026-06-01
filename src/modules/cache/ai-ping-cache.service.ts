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
        const map = await this.getOrCreateMap()
        const providerMap = map[provider] ?? {
        }
        providerMap[key] = {
            status: success,
            lastPing: this.dayjsService.now().toISOString(),
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
