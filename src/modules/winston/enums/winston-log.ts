/** Log event names; each maps to a config entry in configMap (level, loki, messageType). */
export enum WinstonLog {
    CoursesSeededSuccessfully = "CoursesSeededSuccessfully",
    EnrollmentCreated = "EnrollmentCreated",
    EnrollStepExecuted = "EnrollStepExecuted",
    ProcessGitSubmissionStepExecuted = "ProcessGitSubmissionStepExecuted",
    ProcessCVSubmissionStepExecuted = "ProcessCVSubmissionStepExecuted",
    JobExecutedSuccessfully = "JobExecutedSuccessfully",
    JobExecutedFailed = "JobExecutedFailed",
    EnrollmentAlreadyExists = "EnrollmentAlreadyExists",
    CdnSynchronizerCoursesSyncing = "CdnSynchronizerCoursesSyncing",
    CdnSynchronizerCourseSyncedSuccessfully = "CdnSynchronizerCourseSyncedSuccessfully",
    CdnSynchronizerCourseAlreadySynced = "CdnSynchronizerCourseAlreadySynced",
    CdnSynchronizerCourseSyncFailed = "CdnSynchronizerCourseSyncFailed",
    CdnSynchronizerCourseSyncFailedMaxRetriesReached = "CdnSynchronizerCourseSyncFailedMaxRetriesReached",
    CdnSynchronizerCourseSyncFailedAttempt = "CdnSynchronizerCourseSyncFailedAttempt",
    CdnSynchronizerChallengeRuntimeSyncFailed = "CdnSynchronizerChallengeRuntimeSyncFailed",
    CdnSynchronizerCourseRuntimeSyncFailed = "CdnSynchronizerCourseRuntimeSyncFailed",
    CdnSynchronizerLessonVideoRuntimeSyncFailed = "CdnSynchronizerLessonVideoRuntimeSyncFailed",
    CdnSynchronizerModuleRuntimeSyncFailed = "CdnSynchronizerModuleRuntimeSyncFailed",
    CdnSynchronizerContentRuntimeSyncFailed = "CdnSynchronizerContentRuntimeSyncFailed",
    /** CLI: missing subcommand or invalid invocation. */
    CommandError = "CommandError",
    /** CLI: command finished successfully. */
    CommandSuccess = "CommandSuccess",
}
