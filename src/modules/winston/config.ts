
import {
    WinstonLog,
} from "./enums"
import {
    WinstonLevel,
    CoursesSeededSuccessfullyMessage,
} from "./types"
import type {
    CdnSynchronizerCoursesSyncFailedAttemptMessage,
    CdnSynchronizerCoursesSyncFailedMessage,
    CdnSynchronizerCoursesSyncingMessage,
    CdnSynchronizerCoursesSyncFailedMaxRetriesReachedMessage,
    CdnSynchronizerCoursesSyncedSuccessfullyMessage,
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
    [WinstonLog.CdnSynchronizerCoursesSyncedSuccessfully]: {
        name: WinstonLog.CdnSynchronizerCoursesSyncedSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCoursesSyncedSuccessfullyMessage,
    },
    [WinstonLog.CdnSynchronizerCoursesSyncFailed]: {
        name: WinstonLog.CdnSynchronizerCoursesSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCoursesSyncFailedMessage,
    },
    [WinstonLog.CdnSynchronizerCoursesSyncFailedAttempt]: {
        name: WinstonLog.CdnSynchronizerCoursesSyncFailedAttempt,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCoursesSyncFailedAttemptMessage,
    },
    [WinstonLog.CdnSynchronizerCoursesSyncFailedMaxRetriesReached]: {
        name: WinstonLog.CdnSynchronizerCoursesSyncFailedMaxRetriesReached,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCoursesSyncFailedMaxRetriesReachedMessage,
    },
}
