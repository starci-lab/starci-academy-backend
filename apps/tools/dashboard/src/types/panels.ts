/** One Postgres snapshot row entered in the snapshot panel form. */
export interface PgSnapshotRow {
    /** Friendly name used to label the produced dump file. */
    name: string
    /** Postgres connection URL to snapshot. */
    url: string
}
