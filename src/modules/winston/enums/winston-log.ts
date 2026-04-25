/** Log event names; each maps to a config entry in configMap (level, loki, messageType). */
export enum WinstonLog {
    CoursesSeededSuccessfully = "CoursesSeededSuccessfully",
    ContextFileLoadedSuccessfully = "ContextFileLoadedSuccessfully",
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
    /** NATS consumer opened (bridge). */
    NatsConsumerOpened = "NatsConsumerOpened",
    /** NATS consumer closed (bridge). */
    NatsConsumerClosed = "NatsConsumerClosed",
    /** NATS consumer error (bridge). */
    NatsConsumerError = "NatsConsumerError",
    /** Cache: error while getting a cache entry. */
    ErrorGettingCache = "ErrorGettingCache",
    /** Cache: error while setting a cache entry. */
    ErrorSettingCache = "ErrorSettingCache",
    /** Cache: error while deleting a cache entry. */
    ErrorDeletingCache = "ErrorDeletingCache",
    /** Cache debug: Redis manager is OK. */
    CacheDebugOkRedis = "CacheDebugOkRedis",
    /** Cache debug: Memory manager is OK. */
    CacheDebugOkMemory = "CacheDebugOkMemory",
    /** Backup: PostgreSQL backup completed successfully. */
    PgBackupCompletedSuccessfully = "PgBackupCompletedSuccessfully",
}
