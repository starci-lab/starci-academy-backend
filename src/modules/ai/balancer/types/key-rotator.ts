import type {
    ModelProvider,
} from "@modules/databases"
import type {
    KeyState,
} from "./key-state"

/**
 * Params for `KeyRotatorService.next`.
 */
export interface NextKeyParams {
    /** Target provider whose pool will be rotated. */
    provider: ModelProvider
}

/**
 * Result of `KeyRotatorService.next`.
 *
 * Returns the picked {@link KeyState} reference (callers can mutate
 * `failCount` / `lastUsedAt` on it) plus a defensive copy of the raw value
 * for SDK initialization.
 */
export interface NextKeyResult {
    /** Picked key state — mutable reference held by `KeyStoreService`. */
    state: KeyState
    /** Number of active keys available at pick time (for logging). */
    activeKeysCount: number
}
