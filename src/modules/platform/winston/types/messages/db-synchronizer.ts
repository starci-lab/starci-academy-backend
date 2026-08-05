/** Sync operation kind for DB seeder logging. */
export enum DbSyncType {
    /** Row did not exist -- seeder inserted it. */
    Created = "created",
    /** Row existed -- seeder overwrote it from mount data. */
    Updated = "updated",
    /** Row is gone from the mount -- seeder removed it from the DB. */
    Deleted = "deleted",
}

/** Message for when the DB seeder upserts or deletes an entity row. */
export interface DbSynchronizerSyncedSuccessfullyMessage {
    /** Entity class name, e.g. "CourseEntity". */
    entityKind: string
    /** Primary-key value (UUID for most tables). */
    entityId: string
    /** Whether the row was created, updated, or deleted. */
    type: DbSyncType
    /** Mount display id or stringified `orderIndex` when no slug column. */
    displayId: string
    /** Ancestor display ids (e.g. course -> module -> content for challenges). */
    relativeDisplayIds: Array<string>
    /** Present for legacy content/challenge rows (`verified` null). */
    isLegacy?: boolean
}
