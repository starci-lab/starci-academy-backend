/**
 * Result of {@link UpsertService.process}: row ids partitioned by the action applied.
 * Entity buckets are available earlier via {@link UpsertService.partitionUuidSync}.
 */
export interface UpsertManyResult {
    /** Ids inserted — present in the seed payload, absent in the DB. */
    createIds: Array<string>
    /** Ids updated — present in both the seed payload and the DB. */
    updateIds: Array<string>
    /** Ids deleted — stale rows present in the DB but absent from the seed payload. */
    deleteIds: Array<string>
}
