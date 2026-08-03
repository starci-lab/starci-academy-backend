import type {
    Dayjs,
} from "dayjs"

/**
 * Rebuilds the email bloom filter cache entry by scanning users in batches.
 */
export interface SyncEmailBloomFilterPayload {
    /** The timestamp of the sync. */
    syncAt: Dayjs
}
