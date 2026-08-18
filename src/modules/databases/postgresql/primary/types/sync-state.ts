import type {
    SyncStateSourceType,
    SyncStateTarget,
} from "../enums/sync-state"

/** Composite key identifying a single sync-state row (target + source pair). */
export interface SyncStateKey {
    /** The downstream target the source is being synced into. */
    target: SyncStateTarget
    /** The kind of upstream source that owns the snapshot. */
    sourceType: SyncStateSourceType
    /** Stable identifier of the upstream source record. */
    sourceId: string
}

/** A sync-state key extended with the source's latest update timestamp. */
export interface SyncStateSyncInput extends SyncStateKey {
    /** Timestamp of the most recent change on the upstream source. */
    sourceUpdatedAt: Date
}

/** Params for {@link SyncStateService.markFailed} -- the sync input plus the error that caused the failure. */
export interface MarkSyncFailedParams extends SyncStateSyncInput {
    /** The error thrown by the sync attempt (shape not controlled by us). */
    error: unknown
}
