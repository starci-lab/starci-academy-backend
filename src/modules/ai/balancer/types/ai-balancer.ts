import type {
    ModelProvider,
} from "@modules/databases"
import type {
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
    /** Raw API key value — pass to SDK constructor (never log in full). */
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
    /** Last 4 chars of the key value — uniquely identifies the state in the pool. */
    keySuffix: string
}

/**
 * Result of {@link AiBalancerService.healthSnapshot}.
 */
export interface HealthSnapshotResult {
    /** Per-provider key health derived from the mount pool + Redis ping cache. */
    providers: ReadonlyArray<ProviderHealthSnapshot>
}
