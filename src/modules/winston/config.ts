
import {
    WinstonLog,
} from "./enums"
import {
    WinstonLevel,
    CoursesSeededSuccessfullyMessage,
    ContextFileLoadedSuccessfullyMessage,
    EnrollmentAlreadyExistsMessage,
    EnrollmentCreatedMessage,
    StepExecutedMessage,
    JobExecutedMessage,
} from "./types"
import type {
    CommandLogMessage,
    CdnSynchronizerCourseAlreadySyncedMessage,
    CdnSynchronizerCourseSyncFailedAttemptMessage,
    CdnSynchronizerCourseSyncFailedMessage,
    CdnSynchronizerCoursesSyncingMessage,
    CdnSynchronizerCourseSyncFailedMaxRetriesReachedMessage,
    CdnSynchronizerCourseSyncedSuccessfullyMessage,
    CdnSynchronizerChallengeRuntimeSyncFailedMessage,
    CdnSynchronizerCourseRuntimeSyncFailedMessage,
    CdnSynchronizerLessonVideoRuntimeSyncFailedMessage,
    CdnSynchronizerModuleRuntimeSyncFailedMessage,
    CdnSynchronizerContentRuntimeSyncFailedMessage,
    NatsConsumerClosedMessage,
    NatsConsumerErrorMessage,
    NatsConsumerOpenedMessage,
    ErrorDeletingCacheMessage,
    ErrorGettingCacheMessage,
    ErrorSettingCacheMessage,
    CacheDebugOkMemoryMessage,
    CacheDebugOkRedisMessage,
    PgBackupCompletedSuccessfullyMessage,
    PgBackupFailedMessage,
    PgBackupStepFailedMessage,
} from "./types"

/** Map of Winston log names to level, Loki flag, and message type. */
export const configMap = {
    // Courses Seeded Successfully
    [WinstonLog.CoursesSeededSuccessfully]: {
        name: WinstonLog.CoursesSeededSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CoursesSeededSuccessfullyMessage,
    },
    [WinstonLog.ContextFileLoadedSuccessfully]: {
        name: WinstonLog.ContextFileLoadedSuccessfully,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as ContextFileLoadedSuccessfullyMessage,
    },
    // Enrollment worker logs.
    [WinstonLog.EnrollmentCreated]: {
        name: WinstonLog.EnrollmentCreated,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as EnrollmentCreatedMessage,
    },
    [WinstonLog.EnrollmentAlreadyExists]: {
        name: WinstonLog.EnrollmentAlreadyExists,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as EnrollmentAlreadyExistsMessage,
    },
    [WinstonLog.EnrollStepExecuted]: {
        name: WinstonLog.EnrollStepExecuted,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as StepExecutedMessage,
    },
    [WinstonLog.ProcessGitSubmissionStepExecuted]: {
        name: WinstonLog.ProcessGitSubmissionStepExecuted,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as StepExecutedMessage,
    },
    [WinstonLog.ProcessCVSubmissionStepExecuted]: {
        name: WinstonLog.ProcessCVSubmissionStepExecuted,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as StepExecutedMessage,
    },
    [WinstonLog.JobExecutedSuccessfully]: {
        name: WinstonLog.JobExecutedSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as JobExecutedMessage,
    },
    [WinstonLog.JobExecutedFailed]: {
        name: WinstonLog.JobExecutedFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as JobExecutedMessage,
    },
    // CDN synchronizer: errors.
    [WinstonLog.CdnSynchronizerCoursesSyncing]: {
        name: WinstonLog.CdnSynchronizerCoursesSyncing,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCoursesSyncingMessage,
    },
    [WinstonLog.CdnSynchronizerCourseSyncedSuccessfully]: {
        name: WinstonLog.CdnSynchronizerCourseSyncedSuccessfully,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseSyncedSuccessfullyMessage,
    },
    [WinstonLog.CdnSynchronizerCourseAlreadySynced]: {
        name: WinstonLog.CdnSynchronizerCourseAlreadySynced,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseAlreadySyncedMessage,
    },
    [WinstonLog.CdnSynchronizerCourseSyncFailed]: {
        name: WinstonLog.CdnSynchronizerCourseSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseSyncFailedMessage,
    },
    [WinstonLog.CdnSynchronizerCourseSyncFailedAttempt]: {
        name: WinstonLog.CdnSynchronizerCourseSyncFailedAttempt,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseSyncFailedAttemptMessage,
    },
    [WinstonLog.CdnSynchronizerCourseSyncFailedMaxRetriesReached]: {
        name: WinstonLog.CdnSynchronizerCourseSyncFailedMaxRetriesReached,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseSyncFailedMaxRetriesReachedMessage,
    },
    [WinstonLog.CdnSynchronizerChallengeRuntimeSyncFailed]: {
        name: WinstonLog.CdnSynchronizerChallengeRuntimeSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerChallengeRuntimeSyncFailedMessage,
    },
    [WinstonLog.CdnSynchronizerCourseRuntimeSyncFailed]: {
        name: WinstonLog.CdnSynchronizerCourseRuntimeSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseRuntimeSyncFailedMessage,
    },
    [WinstonLog.CdnSynchronizerLessonVideoRuntimeSyncFailed]: {
        name: WinstonLog.CdnSynchronizerLessonVideoRuntimeSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerLessonVideoRuntimeSyncFailedMessage,
    },
    [WinstonLog.CdnSynchronizerModuleRuntimeSyncFailed]: {
        name: WinstonLog.CdnSynchronizerModuleRuntimeSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerModuleRuntimeSyncFailedMessage,
    },
    [WinstonLog.CdnSynchronizerContentRuntimeSyncFailed]: {
        name: WinstonLog.CdnSynchronizerContentRuntimeSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerContentRuntimeSyncFailedMessage,
    },
    [WinstonLog.CommandError]: {
        name: WinstonLog.CommandError,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CommandLogMessage,
    },
    [WinstonLog.CommandSuccess]: {
        name: WinstonLog.CommandSuccess,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CommandLogMessage,
    },
    // NATS bridge logs.
    [WinstonLog.NatsConsumerOpened]: {
        name: WinstonLog.NatsConsumerOpened,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as NatsConsumerOpenedMessage,
    },
    [WinstonLog.NatsConsumerClosed]: {
        name: WinstonLog.NatsConsumerClosed,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as NatsConsumerClosedMessage,
    },
    [WinstonLog.NatsConsumerError]: {
        name: WinstonLog.NatsConsumerError,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as NatsConsumerErrorMessage,
    },
    // Cache service logs.
    [WinstonLog.ErrorGettingCache]: {
        name: WinstonLog.ErrorGettingCache,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as ErrorGettingCacheMessage,
    },
    [WinstonLog.ErrorSettingCache]: {
        name: WinstonLog.ErrorSettingCache,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as ErrorSettingCacheMessage,
    },
    [WinstonLog.ErrorDeletingCache]: {
        name: WinstonLog.ErrorDeletingCache,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as ErrorDeletingCacheMessage,
    },
    [WinstonLog.CacheDebugOkRedis]: {
        name: WinstonLog.CacheDebugOkRedis,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CacheDebugOkRedisMessage,
    },
    [WinstonLog.CacheDebugOkMemory]: {
        name: WinstonLog.CacheDebugOkMemory,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CacheDebugOkMemoryMessage,
    },
    // Backup logs.
    [WinstonLog.PgBackupCompletedSuccessfully]: {
        name: WinstonLog.PgBackupCompletedSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupCompletedSuccessfullyMessage,
    },
    [WinstonLog.PgBackupFailed]: {
        name: WinstonLog.PgBackupFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupFailedMessage,
    },
    [WinstonLog.PgBackupDumpFailed]: {
        name: WinstonLog.PgBackupDumpFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupStepFailedMessage,
    },
    [WinstonLog.PgBackupCompressFailed]: {
        name: WinstonLog.PgBackupCompressFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupStepFailedMessage,
    },
    [WinstonLog.PgBackupEncryptFailed]: {
        name: WinstonLog.PgBackupEncryptFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupStepFailedMessage,
    },
    [WinstonLog.PgBackupUploadFailed]: {
        name: WinstonLog.PgBackupUploadFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupStepFailedMessage,
    },
}
