/**
 * Options for the PostgreSQL sync command.
 */
export interface PgSyncCommandOptions {
    /**
     * The URL of the source PostgreSQL database.
     */
    sourceUrl: string
    /**
     * The URL of the destination PostgreSQL database.
     */
    destinationUrl: string
}
