
import {
    WinstonLog,
} from "./enums"
import {
    WinstonLevel,
    CoursesSeededSuccessfullyMessage,
} from "./types"
import type {
    CdnSynchronizerCoursesSyncFailedMessage,
} from "./types"

/** Map of Winston log names to level, Loki flag, and message type. */
export const configMap = {
    // Courses Seeded Successfully
    [WinstonLog.CoursesSeededSuccessfully]: {
        name: WinstonLog.CoursesSeededSuccessfully,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as CoursesSeededSuccessfullyMessage,
    },
    // CDN synchronizer: errors.
    [WinstonLog.CdnSynchronizerCoursesSyncFailed]: {
        name: WinstonLog.CdnSynchronizerCoursesSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCoursesSyncFailedMessage,
    },
}
