/** Fields added to {@link DbSynchronizerSyncedSuccessfullyMessage} beyond ids and sync type. */
export interface DbSyncLogDisplayFields {
    /** Mount slug or ordinal string when no `displayId` column. */
    displayId: string
    /** Ancestor display ids (entity-specific order). */
    relativeDisplayIds: Array<string>
    /** `true` for legacy mount rows (`verified` null on content/challenge). */
    isLegacy?: boolean
}

/** Parent course stub from parser (may include `displayId`). */
export interface DbSyncLogCourseStub {
    displayId?: string
}

/** Parent module stub. */
export interface DbSyncLogModuleStub {
    displayId?: string
    course?: DbSyncLogCourseStub
}

/** Parent content stub (challenges). */
export interface DbSyncLogContentStub {
    displayId?: string
    module?: DbSyncLogModuleStub
}

/** Parent milestone stub (tasks). */
export interface DbSyncLogMilestoneStub {
    orderIndex?: number
    course?: DbSyncLogCourseStub
}

/** Partial entity shape used to derive DB sync log display fields. */
export interface DbSyncLogEntityShape {
    /** Row display id when the table has a `display_id` column. */
    displayId?: string
    /** Fallback display key when only `order_index` exists (milestones, tasks). */
    orderIndex?: number
    /** SCHEMA V2 marker; null means legacy for content/challenge. */
    verified?: Date | null
    /** Parent course stub from parser (may include `displayId`). */
    course?: DbSyncLogCourseStub
    /** Parent module stub. */
    module?: DbSyncLogModuleStub
    /** Parent content stub (challenges). */
    content?: DbSyncLogContentStub
    /** Parent milestone stub (tasks). */
    milestone?: DbSyncLogMilestoneStub
}
