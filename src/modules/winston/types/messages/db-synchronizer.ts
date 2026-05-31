/** Sync operation kind for DB seeder logging. */
export enum DbSyncType {
    Created = "created",
    Updated = "updated",
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
}
