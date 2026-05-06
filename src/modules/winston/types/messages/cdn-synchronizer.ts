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

/** Message for when CDN synchronizer fails to sync a lesson video runtime payload. */
export interface CdnSynchronizerLessonVideoRuntimeSyncFailedMessage {
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

/** Message for when CDN synchronizer syncs a single entity successfully. */
export interface CdnSynchronizerSyncedSuccessfullyMessage {
    entityKind: string
    entityId: string
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
    error: string
}
