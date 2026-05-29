/**
 * Parameters for backing up a PostgreSQL database.
 */
export interface PgBackupParams {
    /** The connection URL of the PostgreSQL database to dump (passed to `pg_dump --dbname`). */
    postgresUrl: string
    /** The S3 key prefix under which the encrypted backup artifact is stored. */
    s3KeyPrefix: string
    /** The base name used for the temporary dump file and the directory created for the backup. */
    artifactBaseName: string
}
