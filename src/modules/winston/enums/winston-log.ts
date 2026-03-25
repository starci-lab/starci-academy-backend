/** Log event names; each maps to a config entry in configMap (level, loki, messageType). */
export enum WinstonLog {
    CoursesSeededSuccessfully = "CoursesSeededSuccessfully",
    CdnSynchronizerCoursesSyncing = "CdnSynchronizerCoursesSyncing",
    CdnSynchronizerCoursesSyncedSuccessfully = "CdnSynchronizerCoursesSyncedSuccessfully",
    CdnSynchronizerCoursesSyncFailed = "CdnSynchronizerCoursesSyncFailed",
    CdnSynchronizerCoursesSyncFailedMaxRetriesReached = "CdnSynchronizerCoursesSyncFailedMaxRetriesReached",
    CdnSynchronizerCoursesSyncFailedAttempt = "CdnSynchronizerCoursesSyncFailedAttempt",
}
