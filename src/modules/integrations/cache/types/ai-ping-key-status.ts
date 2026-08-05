import type {
    ModelProvider,
} from "@modules/databases"

/**
 * Cached health snapshot for one mount-file API key.
 */
export interface PingKeyStatusEntry {
    /** Whether the latest ping succeeded. */
    status: boolean
    /** ISO-8601 timestamp of the latest ping attempt. */
    lastPing: string
    /**
     * ISO-8601 time until which the key is on cooldown (ineligible). Cleared on
     * success. While `now < cooldownUntil` the key is skipped, then auto-recovers
     * — replaces the old sticky `status:false` that never healed on its own.
     */
    cooldownUntil?: string
    /** Consecutive failures, for escalating the transient cooldown. */
    failCount?: number
    /** Hard-disabled (invalid/revoked key) until the pool reloads. */
    disabled?: boolean
    /** ISO-8601 time the key was last picked — Redis-shared LRU for load spread. */
    lastUsedAt?: string
}

/**
 * Whether a cached key snapshot is eligible to be picked at `now`: not
 * hard-disabled and not within its cooldown window. Unknown keys (no snapshot)
 * are eligible. Pure (clock passed in) so the balancer + tests share one source.
 *
 * @param entry - the cached snapshot, or undefined when the key was never seen.
 * @param now - the reference time.
 * @returns true when the key may be picked now.
 */
export const isPingEntryEligible = (
    entry: PingKeyStatusEntry | undefined,
    now: Date,
): boolean => {
    if (entry === undefined) {
        return true
    }
    if (entry.disabled) {
        return false
    }
    if (
        entry.cooldownUntil
        && new Date(entry.cooldownUntil).getTime() > now.getTime()
    ) {
        return false
    }
    return true
}

/**
 * Per-provider map of raw API key → latest ping snapshot.
 */
export type ProviderPingKeyStatusMap = Record<string, PingKeyStatusEntry>

/**
 * Full Redis payload: provider → key → ping snapshot.
 */
export type AiPingKeyStatusMap = Partial<Record<ModelProvider, ProviderPingKeyStatusMap>>

/**
 * Params for {@link AiPingCacheService.recordPingKeyStatus}.
 */
export interface RecordPingKeyStatusParams {
    /** Provider that was pinged. */
    provider: ModelProvider
    /** Raw API key value. */
    key: string
    /** Whether the ping succeeded. */
    success: boolean
}

/**
 * Params for {@link AiPingCacheService.recordKeyCooldown} — put a key on cooldown
 * (or hard-disable) after a classified failure. Kept primitive (ms + flag) so the
 * cache layer does not depend on the AI balancer's error enum.
 */
export interface RecordKeyCooldownParams {
    /** Provider whose key failed. */
    provider: ModelProvider
    /** Raw API key value. */
    key: string
    /** Milliseconds the key stays ineligible from now. */
    cooldownMs: number
    /** Hard-disable until the pool reloads (invalid/revoked key). */
    disabled?: boolean
}

/**
 * Params for {@link AiPingCacheService.recordKeySuccess}.
 */
export interface RecordKeySuccessParams {
    /** Provider whose key succeeded. */
    provider: ModelProvider
    /** Raw API key value. */
    key: string
}

/**
 * Params for {@link AiPingCacheService.recordKeyPicked}.
 */
export interface RecordKeyPickedParams {
    /** Provider whose key was picked. */
    provider: ModelProvider
    /** Raw API key value. */
    key: string
}
