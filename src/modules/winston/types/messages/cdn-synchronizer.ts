/** Message for when CDN synchronizer starts a courses sync cycle. */
export type CdnSynchronizerCoursesSyncingMessage = {
    /** The message to log. */
    dump?: string
}

/** Message for when a course is synced successfully. */
export interface CdnSynchronizerCoursesSyncedSuccessfullyMessage {
    id: string
}

/** Message for when CDN synchronizer fails an attempt for a single course. */
export interface CdnSynchronizerCoursesSyncFailedAttemptMessage {
    id?: string
    attempt: number
    maxRetries: number
}

/** Message for when CDN synchronizer fails to sync courses (cycle/global). */
export interface CdnSynchronizerCoursesSyncFailedMessage {
    id?: string
    error: string
}

/** Message for when CDN synchronizer fails to sync courses (cycle/global) because max retries were reached. */
export interface CdnSynchronizerCoursesSyncFailedMaxRetriesReachedMessage {
    id?: string
    maxRetries: number
}
