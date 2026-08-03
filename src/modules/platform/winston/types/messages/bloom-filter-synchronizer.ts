/** Message for when Bloom filter synchronizer starts a sync cycle. */
export interface BloomFilterSynchronizerSyncStartedMessage {
    startedAt: unknown
}

/** Message for when Bloom filter synchronizer creates a new filter. */
export interface BloomFilterSynchronizerFilterCreatedMessage {
    filterType: string
}

/** Message for when Bloom filter synchronizer finds filter already exists. */
export interface BloomFilterSynchronizerFilterAlreadyExistsMessage {
    filterType: string
}

/** Message for when Bloom filter synchronizer completes email sync. */
export interface BloomFilterSynchronizerEmailsSyncedMessage {
    totalEmails: number
}

/** Message for when Bloom filter synchronizer completes a sync cycle. */
export interface BloomFilterSynchronizerSyncDoneMessage {
    doneAt: unknown
    durationMs: number
}

/** Message for when Bloom filter synchronizer fails to sync an entity after retries. */
export interface BloomFilterSynchronizerEntitySyncFailedMessage {
    entityKind: string
    entityId: string
    error: string
}
