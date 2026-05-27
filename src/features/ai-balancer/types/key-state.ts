import type {
    ModelProvider,
} from "@modules/databases"
import type {
    KeyStatus,
} from "../enums"

/**
 * Runtime state of a single API key held in memory by `KeyStoreService`.
 *
 * Keys are loaded from the mount file at boot; `KeyRotatorService` reads
 * `status` to pick the next active key; `KeyHealthService` mutates `status`
 * based on ping results and failure counters from `AiBalancerService`.
 */
export interface KeyState {
    /** Raw API key value — never log this in full; use `keySuffix` for logs. */
    value: string
    provider: ModelProvider
    status: KeyStatus
    /** Last 4 chars of `value` for safe identification in logs / admin UI. */
    keySuffix: string
    /** Consecutive failures since the last success. Resets to 0 on success. */
    failCount: number
    /** Wall-clock timestamp of the last attempted use (success or failure). */
    lastUsedAt: Date | null
    /** Wall-clock timestamp of the last health-check ping. */
    lastHealthCheckAt: Date | null
    /** Wall-clock timestamp the key was disabled (for recovery scheduling). */
    disabledAt: Date | null
}

/**
 * Read-only public snapshot of a key for admin queries.
 *
 * Mirrors `KeyState` minus the raw `value` (which must never leave the
 * server boundary).
 */
export interface KeyHealthInfo {
    provider: ModelProvider
    keySuffix: string
    status: KeyStatus
    failCount: number
    lastUsedAt: Date | null
    lastHealthCheckAt: Date | null
    disabledAt: Date | null
}

/**
 * Snapshot of a provider's full pool — used by `healthSnapshot()` and admin UI.
 */
export interface ProviderHealthSnapshot {
    provider: ModelProvider
    keysFilePath: string
    totalKeys: number
    activeKeys: number
    disabledKeys: number
    keys: ReadonlyArray<KeyHealthInfo>
}
