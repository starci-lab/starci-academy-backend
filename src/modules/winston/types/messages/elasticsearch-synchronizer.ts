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
