/** Message for when CDN synchronizer starts a courses sync cycle. */
export type CdnSynchronizerCoursesSyncingMessage = {
    /** The message to log. */
    dump?: string
}

/** Message for when a course is synced successfully. */
export interface CdnSynchronizerCourseSyncedSuccessfullyMessage {
    id: string
}

/** Message for when a course is already synced (no upload needed). */
export interface CdnSynchronizerCourseAlreadySyncedMessage {
    id: string
    cdnUrl: string
}

/** Message for when CDN synchronizer fails an attempt for a single course. */
export interface CdnSynchronizerCourseSyncFailedAttemptMessage {
    id?: string
    attempt: number
    maxRetries: number
}

/** Message for when CDN synchronizer fails to sync courses (cycle/global). */
export interface CdnSynchronizerCourseSyncFailedMessage {
    id?: string
    error: string
}

/** Message for when CDN synchronizer fails to sync courses (cycle/global) because max retries were reached. */
export interface CdnSynchronizerCourseSyncFailedMaxRetriesReachedMessage {
    id?: string
    maxRetries: number
}

/** Message for when CDN synchronizer fails to sync a challenge runtime payload. */
export interface CdnSynchronizerChallengeRuntimeSyncFailedMessage {
    id: string
    error: string
    errorName?: string
    errorStack?: string
    objectKey?: string
    providers?: string[]
    context?: string
}

/** Message for when CDN synchronizer fails to sync a course runtime payload. */
export interface CdnSynchronizerCourseRuntimeSyncFailedMessage {
    id: string
    error: string
    errorName?: string
    errorStack?: string
    objectKey?: string
    providers?: string[]
    context?: string
}

/** Message for when CDN synchronizer fails to sync a module runtime payload. */
export interface CdnSynchronizerModuleRuntimeSyncFailedMessage {
    id: string
    error: string
    errorName?: string
    errorStack?: string
    objectKey?: string
    providers?: string[]
    context?: string
}

/** Message for when CDN synchronizer fails to sync a content runtime payload. */
export interface CdnSynchronizerContentRuntimeSyncFailedMessage {
    id: string
    error: string
    errorName?: string
    errorStack?: string
    objectKey?: string
    providers?: string[]
    context?: string
}

/** Message for when CDN synchronizer starts a sync cycle. */
export interface CdnSynchronizerCdnSyncStartedMessage {
    startedAt: unknown
}

/** Message for when CDN synchronizer starts syncing one entity kind. */
export interface CdnSynchronizerEntityKindStartedMessage {
    /** TypeORM entity class name (`CourseEntity`, `ContentEntity`, ...). */
    entityKind: string
}

/** Message for when CDN synchronizer starts one entity (before hydrate/upload). */
export interface CdnSynchronizerEntitySyncStartedMessage {
    /** TypeORM entity class name. */
    entityKind: string
    /** Entity primary key. */
    entityId: string
    /** Mount display id when available. */
    displayId?: string
}

/** Message for when CDN synchronizer skips an entity (scope gate). */
export interface CdnSynchronizerEntitySkippedMessage {
    /** TypeORM entity class name. */
    entityKind: string
    /** Entity primary key. */
    entityId: string
    /** Mount display id when available. */
    displayId?: string
    /** Human-readable skip reason (e.g. `course-disabled`, `module-out-of-scope`). */
    reason: string
}

/** Message for a CDN materialize sub-step (hydrate, serialize, upload). */
export interface CdnSynchronizerMaterializeStepMessage {
    /** Sub-step name (`hydrate-start`, `hydrate-done`, `upload-start`, `upload-done`). */
    step: string
    /** TypeORM entity class name. */
    entityKind: string
    /** Entity primary key. */
    entityId: string
    /** Mount display id when available. */
    displayId?: string
    /** Locale being materialized (when applicable). */
    locale?: string
    /** S3 object key being written (when applicable). */
    objectKey?: string
    /** Nested module count after course hydrate (when applicable). */
    moduleCount?: number
    /** Serialized payload size in bytes (when applicable). */
    payloadBytes?: number
    /** Elapsed milliseconds for the sub-step (when applicable). */
    durationMs?: number
    /** Free-form diagnostic detail (e.g. resolved scope JSON). */
    detail?: string
}

/** Message for when CDN synchronizer syncs a single entity successfully. */
export interface CdnSynchronizerSyncedSuccessfullyMessage {
    /** TypeORM entity class name. */
    entityKind: string
    /** Entity primary key. */
    entityId: string
    /** Mount display id of the synced row. */
    displayId: string
    /** Ancestor display ids (course -> module -> content for challenges). */
    relativeDisplayIds: Array<string>
    /** Present when legacy mount schema (`verified` null on content/challenge). */
    isLegacy?: boolean
}

/** Message for when CDN synchronizer completes a sync cycle. */
export interface CdnSynchronizerCdnSyncDoneMessage {
    doneAt: unknown
    durationMs: number
}

/** Message for when CDN synchronizer fails to sync an entity after retries. */
export interface CdnSynchronizerEntitySyncFailedMessage {
    entityKind: string
    entityId: string
    /** Error name when available (e.g. `CredentialsProviderError`). */
    errorName?: string
    /** Error message (or stringified error). */
    errorMessage: string
    /** Stack trace when the error is an `Error`. */
    errorStack?: string
}

/** Message for the reconcile diff: orphan keys found on a provider for one prefix. */
export interface CdnSynchronizerReconcileOrphansFoundMessage {
    /** S3 provider scanned (e.g. `minio`, `digitalOcean`). */
    provider: string
    /** Key prefix scanned (e.g. `courses`). */
    prefix: string
    /** Distinct id/displayId segments currently present under the prefix. */
    existingCount: number
    /** Distinct id/displayId segments the database says should exist. */
    desiredCount: number
    /** Segments present in the store but absent from the database. */
    orphanCount: number
    /** A few example orphan segments for quick eyeballing. */
    sampleOrphans: Array<string>
    /** Whether deletion is enabled for this run (`SYNC_PRUNE_ORPHANS`). */
    pruneEnabled: boolean
}

/** Message for when reconcile deleted orphan keys from a provider for one prefix. */
export interface CdnSynchronizerReconcileOrphansDeletedMessage {
    /** S3 provider the keys were removed from. */
    provider: string
    /** Key prefix the orphans belonged to. */
    prefix: string
    /** Orphan id/displayId segments removed. */
    orphanSegmentCount: number
    /** Concrete object keys removed (segments x locales). */
    deletedKeyCount: number
}

/** Message for when reconcile skipped deletion because the orphan ratio was too high. */
export interface CdnSynchronizerReconcileSkippedBySafetyMessage {
    /** S3 provider that would have been pruned. */
    provider: string
    /** Key prefix that would have been pruned. */
    prefix: string
    /** Orphan segment count that triggered the safety valve. */
    orphanCount: number
    /** Total existing segment count under the prefix. */
    existingCount: number
    /** Observed orphan ratio (orphan / existing). */
    ratio: number
    /** Configured maximum allowed ratio (`SYNC_PRUNE_MAX_RATIO`). */
    maxRatio: number
}
