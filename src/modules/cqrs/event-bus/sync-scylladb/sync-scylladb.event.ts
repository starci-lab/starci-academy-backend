export type SyncScyllaDBEntityType = "course" | "challenge" | "content"

/**
 * Event emitted when a write-flow wants to sync one entity immediately to ScyllaDB.
 */
export class SyncScyllaDBEvent {
    constructor(
        readonly payload: {
            entityType: SyncScyllaDBEntityType
            id: string
        },
    ) {
    }
}
