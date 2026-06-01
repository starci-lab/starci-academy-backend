import {
    AiPingCacheService,
} from "@modules/cache"
import {
    Injectable,
} from "@nestjs/common"
import {
    KeyStatus,
} from "./enums"
import type {
    AcquireKeyParams,
    AcquireKeyResult,
    HealthSnapshotResult,
    KeyHealthInfo,
    ProviderHealthSnapshot,
} from "./types"
import {
    KeyRotatorService,
} from "./key-rotator.service"
import {
    KeyStoreService,
} from "./key-store.service"

/**
 * Public façade of the AI Balancer key pool.
 *
 * - {@link acquire} — round-robin pick skipping keys marked unhealthy in Redis.
 * - {@link healthSnapshot} — admin read model merging mount keys + ping cache.
 * - {@link reload} — refresh pools from mount files.
 */
@Injectable()
export class AiBalancerService {
    constructor(
        private readonly keyStoreService: KeyStoreService,
        private readonly keyRotatorService: KeyRotatorService,
        private readonly aiPingCacheService: AiPingCacheService,
    ) { }

    /**
     * Pick the next eligible key for a provider (round-robin, cache-aware).
     * @param params - Target provider.
     * @returns Raw key value + opaque handle.
     */
    async acquire({
        provider,
    }: AcquireKeyParams): Promise<AcquireKeyResult> {
        const {
            state,
        } = await this.keyRotatorService.next({
            provider,
        })

        return {
            value: state.value,
            handle: {
                provider: state.provider,
                keySuffix: state.keySuffix,
            },
        }
    }

    /**
     * Read-only snapshot for admin UI / GraphQL — never exposes raw key values.
     * @returns Per-provider summary derived from mount pool + Redis ping cache.
     */
    async healthSnapshot(): Promise<HealthSnapshotResult> {
        const cacheMap = await this.aiPingCacheService.getMap()
        const providers = this.keyStoreService.listProviders()
        const snapshots: Array<ProviderHealthSnapshot> = providers.map(({
            provider,
            keysFilePath,
        }) => {
            const pool = this.keyStoreService.getPool(provider)
            const providerCache = cacheMap[provider] ?? {
            }

            const keys: Array<KeyHealthInfo> = pool.map((key) => {
                const cached = providerCache[key.value]
                const healthy = cached === undefined || cached.status === true
                return {
                    provider: key.provider,
                    keySuffix: key.keySuffix,
                    status: healthy ? KeyStatus.Active : KeyStatus.Disabled,
                    failCount: cached?.status === false ? 1 : 0,
                    lastUsedAt: key.lastUsedAt,
                    lastHealthCheckAt: cached?.lastPing
                        ? new Date(cached.lastPing)
                        : null,
                    disabledAt: healthy ? null : key.lastUsedAt,
                }
            })

            const activeKeys = keys.filter((key) => key.status === KeyStatus.Active).length
            const disabledKeys = keys.length - activeKeys

            return {
                provider,
                keysFilePath,
                totalKeys: pool.length,
                activeKeys,
                disabledKeys,
                keys,
            }
        })

        return {
            providers: snapshots,
        }
    }

    /**
     * Force a fresh load from disk (admin op when ops adds a key).
     */
    async reload(): Promise<void> {
        await this.keyStoreService.reloadAll()
    }
}
