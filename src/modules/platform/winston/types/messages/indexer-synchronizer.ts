/** Message for when Indexer synchronizer starts a sync cycle. */
export interface IndexerSynchronizerSyncStartedMessage {
    startedAt: unknown
}

/** Message for when Indexer synchronizer syncs a single entity successfully. */
export interface IndexerSynchronizerSyncedSuccessfullyMessage {
    /** TypeORM entity class name (e.g. `ChallengeEntity`). */
    entityKind: string
    /** Entity primary key. */
    entityId: string
    /** Mount slug / display id of the synced row (omitted by incremental sync). */
    displayId?: string
    /** Ancestor display ids from course → … → parent (empty for course). */
    relativeDisplayIds?: Array<string>
    /** `true` when row uses legacy mount schema (no `# verified` / `verified` null). */
    isLegacy?: boolean
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
