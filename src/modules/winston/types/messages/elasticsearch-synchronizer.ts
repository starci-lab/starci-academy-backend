/** Message for when Elasticsearch synchronizer starts a sync cycle. */
export interface EsSynchronizerSyncStartedMessage {
    startedAt: unknown
}

/** Message for when Elasticsearch synchronizer syncs a single entity successfully. */
export interface EsSynchronizerSyncedSuccessfullyMessage {
    entityKind: string
    entityId: string
}

/** Message for when Elasticsearch synchronizer completes a sync cycle. */
export interface EsSynchronizerSyncDoneMessage {
    doneAt: unknown
    durationMs: number
}

/** Message for when Elasticsearch synchronizer fails to sync an entity. */
export interface EsSynchronizerEntitySyncFailedMessage {
    entityKind: string
    entityId: string
    error: string
}

/** Message for the reconcile diff: orphan docs found in one per-locale index. */
export interface EsSynchronizerReconcileOrphansFoundMessage {
    /** Concrete index scanned (e.g. `courses-vi`). */
    index: string
    /** Documents currently stored in the index. */
    existingCount: number
    /** Documents the database says should exist. */
    desiredCount: number
    /** Approximate orphan count (existing − desired, floored at 0). */
    orphanCount: number
    /** Whether deletion is enabled for this run (`SYNC_PRUNE_ORPHANS`). */
    pruneEnabled: boolean
}

/** Message for when reconcile deleted orphan docs from a per-locale index. */
export interface EsSynchronizerReconcileOrphansDeletedMessage {
    /** Concrete index pruned (e.g. `courses-vi`). */
    index: string
    /** Documents actually deleted by the prune query. */
    deletedCount: number
}

/** Message for when reconcile skipped deletion because the orphan ratio was too high. */
export interface EsSynchronizerReconcileSkippedBySafetyMessage {
    /** Concrete index that would have been pruned. */
    index: string
    /** Orphan doc count that triggered the safety valve. */
    orphanCount: number
    /** Total existing doc count in the index. */
    existingCount: number
    /** Observed orphan ratio (orphan / existing). */
    ratio: number
    /** Configured maximum allowed ratio (`SYNC_PRUNE_MAX_RATIO`). */
    maxRatio: number
}
