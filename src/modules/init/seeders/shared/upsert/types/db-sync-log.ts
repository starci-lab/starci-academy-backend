/** Fields added to {@link DbSynchronizerSyncedSuccessfullyMessage} beyond ids and sync type. */
export interface DbSyncLogDisplayFields {
    /** Mount slug or ordinal string when no `displayId` column. */
    displayId: string
    /** Ancestor display ids (entity-specific order). */
    relativeDisplayIds: Array<string>
    /** `true` for legacy mount rows (`verified` null on content/challenge). */
    isLegacy?: boolean
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
    course?: {
        displayId?: string
    }
    /** Parent module stub. */
    module?: {
        displayId?: string
        course?: {
            displayId?: string
        }
    }
    /** Parent content stub (challenges). */
    content?: {
        displayId?: string
        module?: {
            displayId?: string
            course?: {
                displayId?: string
            }
        }
    }
    /** Parent milestone stub (tasks). */
    milestone?: {
        orderIndex?: number
        course?: {
            displayId?: string
        }
    }
}
