import type {
    ModelProvider,
} from "@modules/databases"
import type {
    KeyHealthInfo,
    ProviderHealthSnapshot,
} from "./key-state"

/**
 * Params for {@link AiBalancerService.acquire}.
 */
export interface AcquireKeyParams {
    /** Provider whose pool will be rotated. */
    provider: ModelProvider
}

/**
 * Result of {@link AiBalancerService.acquire}.
 */
export interface AcquireKeyResult {
    /** Raw API key value -- pass to SDK constructor (never log in full). */
    value: string
    /** Opaque handle identifying the key in the pool. */
    handle: AcquiredKeyHandle
}

/**
 * Opaque token returned alongside an acquired key.
 */
export interface AcquiredKeyHandle {
    /** Provider that owns the key. */
    provider: ModelProvider
    /** Last 4 chars of the key value -- uniquely identifies the state in the pool. */
    keySuffix: string
}

/**
 * Result of {@link AiBalancerService.healthSnapshot}.
 */
export interface HealthSnapshotResult {
    /** Per-provider key health derived from the mount pool + Redis ping cache. */
    providers: ReadonlyArray<ProviderHealthSnapshot>
}

/**
 * One model/file group in {@link AiBalancerService.modelKeyHealth} -- the keys
 * loaded from a single `keysFilePath` plus the models that use them, each key
 * carrying its live health from the ping cache.
 */
export interface ModelKeyHealthGroup {
    /** Provider that serves the keys in this file. */
    provider: ModelProvider
    /** The `.key` mount file these keys were loaded from. */
    keysFilePath: string
    /** Names of enabled models that load their keys from this file. */
    models: ReadonlyArray<string>
    /** Total keys loaded from the file. */
    totalKeys: number
    /** Keys eligible right now (healthy / not cooling / not disabled). */
    activeKeys: number
    /** Keys currently unhealthy (failing ping / cooling / disabled). */
    disabledKeys: number
    /** Per-key health (raw value never exposed). */
    keys: ReadonlyArray<KeyHealthInfo>
}

/**
 * Result of {@link AiBalancerService.modelKeyHealth} -- key health grouped per
 * model/file (one `.key` per model), for the admin system-health page.
 */
export interface ModelKeyHealthResult {
    /** One entry per `(provider, keysFilePath)` group. */
    groups: ReadonlyArray<ModelKeyHealthGroup>
}
