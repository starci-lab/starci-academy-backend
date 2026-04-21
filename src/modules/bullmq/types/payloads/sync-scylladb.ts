/** Supported source entity types for ScyllaDB on-demand sync jobs. */
export type SyncScyllaDBEntityType = "course" | "challenge" | "content" | "lessonVideo"

/** Payload for a sync-scylladb BullMQ job. */
export interface SyncScyllaDBPayload {
    /** Entity kind that determines which runtime sync service to invoke. */
    entityType: SyncScyllaDBEntityType
    /** Source entity id from PostgreSQL. */
    id: string
}
