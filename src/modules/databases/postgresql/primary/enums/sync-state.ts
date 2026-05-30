/** Sync destination target. */
export enum SyncStateTarget {
    Elasticsearch = "elasticsearch",
    ScyllaDB = "scylladb"
    }

/** Sync source entity type. */
export enum SyncStateSourceType {
    Course = "course",
    Challenge = "challenge",
    Content = "content",
    }

/** Current sync-state lifecycle status. */
export enum SyncStateStatus {
    Pending = "pending",
    Syncing = "syncing",
    Synced = "synced",
    Failed = "failed"
    }
