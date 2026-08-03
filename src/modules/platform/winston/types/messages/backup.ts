export interface PgBackupCompletedSuccessfullyMessage {
    /** Backup artifact name (e.g. primary-backup, keycloak-backup). */
    name: string
    /** Full S3 key of the uploaded encrypted artifact. */
    s3Key: string
}

export interface PgBackupFailedMessage {
    /** Backup artifact name (e.g. primary-backup, keycloak-backup). */
    name: string
    /** S3 key prefix targeted for the upload. */
    s3KeyPrefix: string
    /** Error message. */
    error: string
}

export interface PgBackupStepFailedMessage {
    /** Backup artifact name (e.g. primary-backup, keycloak-backup). */
    name: string
    /** S3 key prefix targeted for the upload. */
    s3KeyPrefix: string
    /** Which step failed. */
    step: "pg_dump" | "gzip" | "openssl" | "s3_upload"
    /** Error message. */
    error: string
}

