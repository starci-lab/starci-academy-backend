
import {
    WinstonLog,
} from "./enums"
import {
    WinstonLevel,
    CoursesSeededSuccessfullyMessage,
    EnrollmentAlreadyExistsMessage,
    EnrollmentCreatedMessage,
} from "./types"
import type {
    CdnSynchronizerCourseAlreadySyncedMessage,
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
}
