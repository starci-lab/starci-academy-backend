/** Encrypted dump reached S3 -- name + key so restore runbooks can fetch the artifact. */
export interface PgBackupCompletedSuccessfullyMessage {
    /** Backup artifact name (e.g. primary-backup, keycloak-backup). */
    name: string
    /** Full S3 key of the uploaded encrypted artifact. */
    s3Key: string
}

/** Whole backup job aborted -- prefix + error; do not treat the last S3 object as complete. */
export interface PgBackupFailedMessage {
    /** Backup artifact name (e.g. primary-backup, keycloak-backup). */
    name: string
    /** S3 key prefix targeted for the upload. */
    s3KeyPrefix: string
    /** Error message. */
    error: string
}

/** One pipeline step (dump/gzip/openssl/upload) failed -- later steps were skipped. */
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

