/** Message for when Indexer synchronizer starts a sync cycle. */
export interface IndexerSynchronizerSyncStartedMessage {
    startedAt: unknown
}

/** Message for when Indexer synchronizer syncs a single entity successfully. */
export interface IndexerSynchronizerSyncedSuccessfullyMessage {
    entityKind: string
    entityId: string
}

/** Message for when Indexer synchronizer completes a sync cycle. */
export interface IndexerSynchronizerSyncDoneMessage {
    doneAt: unknown
    durationMs: number
}

/** Message for when Indexer synchronizer fails to sync an entity. */
export interface IndexerSynchronizerEntitySyncFailedMessage {
    entityKind: string
    entityId: string
    error: string
}
