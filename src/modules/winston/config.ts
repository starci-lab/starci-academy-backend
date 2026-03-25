
import {
    WinstonLog,
} from "./enums"
import {
    WinstonLevel,
    CoursesSeededSuccessfullyMessage,
} from "./types"
import type {
    CdnSynchronizerCourseSyncFailedAttemptMessage,
    CdnSynchronizerCourseSyncFailedMessage,
    CdnSynchronizerCoursesSyncingMessage,
    CdnSynchronizerCourseSyncFailedMaxRetriesReachedMessage,
    CdnSynchronizerCourseSyncedSuccessfullyMessage,
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
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseSyncedSuccessfullyMessage,
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
}
