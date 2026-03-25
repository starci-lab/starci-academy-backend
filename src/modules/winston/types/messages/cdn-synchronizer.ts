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
