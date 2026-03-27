/** Log event names; each maps to a config entry in configMap (level, loki, messageType). */
export enum WinstonLog {
    CoursesSeededSuccessfully = "CoursesSeededSuccessfully",
    EnrollmentCreated = "EnrollmentCreated",
    EnrollmentAlreadyExists = "EnrollmentAlreadyExists",
    CdnSynchronizerCoursesSyncing = "CdnSynchronizerCoursesSyncing",
    CdnSynchronizerCourseSyncedSuccessfully = "CdnSynchronizerCourseSyncedSuccessfully",
    CdnSynchronizerCourseAlreadySynced = "CdnSynchronizerCourseAlreadySynced",
    CdnSynchronizerCourseSyncFailed = "CdnSynchronizerCourseSyncFailed",
    CdnSynchronizerCourseSyncFailedMaxRetriesReached = "CdnSynchronizerCourseSyncFailedMaxRetriesReached",
    CdnSynchronizerCourseSyncFailedAttempt = "CdnSynchronizerCourseSyncFailedAttempt",
}
