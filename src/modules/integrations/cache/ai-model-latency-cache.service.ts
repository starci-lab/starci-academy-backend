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
    AiModelLatencyMap,
    RecordModelLatencyParams,
} from "./types"

@Injectable()
/**
 * Redis-backed store for per-MODEL latency probe snapshots.
 *
 * Shape: `Record<modelName, { provider, ok, latencyMs, checkedAt, errorMessage }>`.
 * Written by the per-model latency probe scheduler each cycle and read by the
 * public `aiModelLatency` query. A SEPARATE layer from {@link AiPingCacheService}
 * (per-provider key health) — this one is UI/status only and never feeds key
 * eligibility. TTL is effectively infinite ({@link CacheKey.AiModelLatency});
 * the scheduler keeps it fresh by overwriting every cycle.
 */
export class AiModelLatencyCacheService implements OnModuleInit {
    constructor(
        private readonly cacheService: CacheService,
    ) { }

    /**
     * Seed an empty map in Redis when the key does not exist yet.
     */
    async onModuleInit(): Promise<void> {
        // make sure a read before the first probe cycle returns {} not undefined
        await this.getOrCreateMap()
    }

    /**
     * Persist the outcome of one model probe, overwriting the previous snapshot
     * for that model.
     * @param params - Model name, provider, success flag, latency, error.
     */
    async recordModelLatency({
        model,
        provider,
        ok,
        latencyMs,
        errorMessage,
    }: RecordModelLatencyParams): Promise<void> {
        // load the current map (created empty on first call)
        const map = await this.getOrCreateMap()
        // overwrite this model's snapshot with the latest probe result; stamp the
        // probe time so the status page can show freshness per model
        map[model] = {
            provider,
            ok,
            latencyMs,
            checkedAt: new Date().toISOString(),
            errorMessage,
        }
        // persist the whole map back (single key holds every model's snapshot)
        await this.cacheService.set({
            key: CacheKey.AiModelLatency,
            cacheResult: map,
        })
    }

    /**
     * Read the full model → latency snapshot map from Redis.
     * @returns Cached latency snapshots for every model probed so far.
     */
    async getAll(): Promise<AiModelLatencyMap> {
        return this.getOrCreateMap()
    }

    /**
     * Load the map from Redis, creating an empty payload when missing.
     * @returns The cached map (possibly newly initialized).
     */
    private async getOrCreateMap(): Promise<AiModelLatencyMap> {
        // try the existing snapshot first
        const existing = await this.cacheService.get({
            key: CacheKey.AiModelLatency,
        })
        if (existing !== undefined) {
            return existing
        }
        // nothing stored yet → seed an empty map so callers never see undefined
        const empty: AiModelLatencyMap = {
        }
        await this.cacheService.set({
            key: CacheKey.AiModelLatency,
            cacheResult: empty,
        })
        return empty
    }
}
