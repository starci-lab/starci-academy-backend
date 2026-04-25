export interface PgBackupCompletedSuccessfullyMessage {
    /** Backup artifact name (e.g. primary-backup, keycloak-backup). */
    name: string
    /** Full S3 key of the uploaded encrypted artifact. */
    s3Key: string
}

