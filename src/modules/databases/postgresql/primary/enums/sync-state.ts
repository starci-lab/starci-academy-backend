/** Sync destination target. */
export enum SyncStateTarget {
    /** Downstream write goes to the Elasticsearch index (search / catalog). */
    Elasticsearch = "elasticsearch",
    /** Downstream write goes to ScyllaDB (wide-column read model). */
    ScyllaDB = "scylladb"
    }

/** Sync source entity type. */
export enum SyncStateSourceType {
    /** Cursor tracks a `courses` row — course graph changes bump this source. */
    Course = "course",
    /** Cursor tracks a `challenges` row. */
    Challenge = "challenge",
    /** Cursor tracks a `contents` (lesson) row. */
    Content = "content",
    }

/** Current sync-state lifecycle status. */
export enum SyncStateStatus {
    /** Not started — eligible for pickup on the next worker pass. */
    Pending = "pending",
    /** In-flight claim — a second worker must not dispatch the same snapshot. */
    Syncing = "syncing",
    /** Downstream matches `sourceUpdatedAt`; further syncs skip until the source moves. */
    Synced = "synced",
    /** Last attempt failed — `lastError` is stored and `nextRetryAt` schedules backoff. */
    Failed = "failed"
    }
