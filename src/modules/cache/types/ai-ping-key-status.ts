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
