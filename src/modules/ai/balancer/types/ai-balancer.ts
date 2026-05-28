import type {
    ModelProvider,
} from "@modules/databases"
import type {
    ProviderHealthSnapshot,
} from "./key-state"

/**
 * Params for `AiBalancerService.acquire`.
 */
export interface AcquireKeyParams {
    /** Provider whose pool will be rotated. */
    provider: ModelProvider
}

/**
 * Result of `AiBalancerService.acquire`.
 *
 * Callers use `value` to initialise the provider SDK and pass `handle` back
 * to `markSuccess` / `markFailure` after the upstream call completes.
 */
export interface AcquireKeyResult {
    /** Raw API key value — pass to SDK constructor (never log in full). */
    value: string
    /** Opaque handle used by `markSuccess` / `markFailure` to identify this key. */
    handle: AcquiredKeyHandle
}

/**
 * Opaque token returned alongside an acquired key. Carries enough info for
 * the balancer to find the original `KeyState` without exposing it directly.
 */
export interface AcquiredKeyHandle {
    provider: ModelProvider
    /** Last 4 chars of the key value — uniquely identifies the state in the pool. */
    keySuffix: string
}

/**
 * Params for `AiBalancerService.markFailure`.
 */
export interface MarkFailureParams {
    handle: AcquiredKeyHandle
    /** Short error string captured from the failed upstream call. */
    reason: string
}

/**
 * Params for `AiBalancerService.markSuccess`.
 */
export interface MarkSuccessParams {
    handle: AcquiredKeyHandle
}

/**
 * Result of `AiBalancerService.healthSnapshot`.
 */
export interface HealthSnapshotResult {
    providers: ReadonlyArray<ProviderHealthSnapshot>
}
