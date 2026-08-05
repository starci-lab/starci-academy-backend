import {
    AiPingCacheService,
} from "@modules/cache"
import type {
    PingKeyStatusEntry,
} from "@modules/cache"
import {
    Injectable,
} from "@nestjs/common"
import {
    KeyStatus,
} from "./enums/key-status"
import type {
    AcquireKeyParams,
    AcquireKeyResult,
    HealthSnapshotResult,
    ModelKeyHealthGroup,
    ModelKeyHealthResult,
} from "./types/ai-balancer"
import type {
    KeyHealthInfo,
    KeyState,
    ProviderHealthSnapshot,
} from "./types/key-state"
import {
    AiModelCatalogService,
} from "./ai-model-catalog.service"
import {
    KeyRotatorService,
} from "./key-rotator.service"
import {
    KeyStoreService,
} from "./key-store.service"

@Injectable()
/**
 * Public façade of the AI Balancer key pool.
 *
 * - {@link acquire} -- round-robin pick skipping keys marked unhealthy in Redis.
 * - {@link healthSnapshot} -- admin read model merging mount keys + ping cache.
 * - {@link reload} -- refresh pools from mount files.
 */
export class AiBalancerService {
    constructor(
        private readonly keyStoreService: KeyStoreService,
        private readonly keyRotatorService: KeyRotatorService,
        private readonly aiPingCacheService: AiPingCacheService,
        private readonly aiModelCatalogService: AiModelCatalogService,
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
     * Read-only snapshot for admin UI / GraphQL -- never exposes raw key values.
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

            const keys = pool.map((key) => this.toKeyHealth(
                key,
                providerCache[key.value],
            ))

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
     * Per-MODEL key health for the admin system-health page: groups every key by
     * the `.key` file it was loaded from (one file per model), tags each group
     * with the models that use it, and attaches each key's live ping health.
     *
     * @returns One group per `(provider, keysFilePath)` with per-key health.
     */
    async modelKeyHealth(): Promise<ModelKeyHealthResult> {
        const cacheMap = await this.aiPingCacheService.getMap()
        const models = await this.aiModelCatalogService.enabledModels()

        // map `provider::keysFilePath` -> the model names that load from that file
        const modelsByFile = new Map<string, Array<string>>()
        for (const model of models) {
            const groupKey = `${model.provider}::${model.keysFilePath}`
            const names = modelsByFile.get(groupKey) ?? []
            names.push(model.name)
            modelsByFile.set(
                groupKey,
                names,
            )
        }

        const groups: Array<ModelKeyHealthGroup> = []
        for (const {
            provider,
        } of this.keyStoreService.listProviders()) {
            const providerCache = cacheMap[provider] ?? {
            }

            // group this provider's pool keys by their source file
            const keysByFile = new Map<string, Array<KeyState>>()
            for (const key of this.keyStoreService.getPool(provider)) {
                const inFile = keysByFile.get(key.keysFilePath) ?? []
                inFile.push(key)
                keysByFile.set(
                    key.keysFilePath,
                    inFile,
                )
            }

            for (const [
                keysFilePath,
                keysInFile,
            ] of keysByFile) {
                const keys = keysInFile.map((key) => this.toKeyHealth(
                    key,
                    providerCache[key.value],
                ))
                const activeKeys = keys.filter((key) => key.status === KeyStatus.Active).length
                groups.push({
                    provider,
                    keysFilePath,
                    models: modelsByFile.get(`${provider}::${keysFilePath}`) ?? [],
                    totalKeys: keys.length,
                    activeKeys,
                    disabledKeys: keys.length - activeKeys,
                    keys,
                })
            }
        }

        return {
            groups,
        }
    }

    /**
     * Derive one key's public health from its in-memory state + ping-cache entry.
     * Shared by {@link healthSnapshot} (per provider) and {@link modelKeyHealth}
     * (per model/file). Never exposes the raw key value.
     *
     * @param key - The in-memory key state.
     * @param cached - The key's latest ping snapshot, or undefined when never pinged.
     * @returns The admin-safe key health.
     */
    private toKeyHealth(
        key: KeyState,
        cached: PingKeyStatusEntry | undefined,
    ): KeyHealthInfo {
        const healthy = cached === undefined || cached.status === true
        return {
            provider: key.provider,
            keySuffix: key.keySuffix,
            keyMask: this.maskKey(key.value),
            status: healthy ? KeyStatus.Active : KeyStatus.Disabled,
            failCount: cached?.status === false ? 1 : 0,
            lastUsedAt: key.lastUsedAt,
            lastHealthCheckAt: cached?.lastPing
                ? new Date(cached.lastPing)
                : null,
            disabledAt: healthy ? null : key.lastUsedAt,
        }
    }

    /**
     * Mask a raw key for display -- `abc...def` (first 3 + last 3 chars). Short
     * values (placeholders like the local `ollama` token) are returned as-is.
     * The raw value never leaves the server; this is the public-safe form.
     *
     * @param value - The raw key value.
     * @returns The masked key string.
     */
    private maskKey(value: string): string {
        return value.length > 8
            ? `${value.slice(0,
                3)}...${value.slice(-3)}`
            : value
    }

    /**
     * Force a fresh load from disk (admin op when ops adds a key).
     */
    async reload(): Promise<void> {
        await this.keyStoreService.reloadAll()
    }
}
