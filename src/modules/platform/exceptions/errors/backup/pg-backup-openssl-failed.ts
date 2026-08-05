import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** openssl exit code + stderr so the failed encryption step is diagnosable. */
export interface PgBackupOpenSslFailedExceptionMetadata extends AbstractExceptionMetadata {
    exitCode: unknown
    stderr?: string
}

/** Stops the backup pipeline after encryption fails -- plaintext dumps stay off S3. */
export class PgBackupOpenSslFailedException extends AbstractException {
    constructor(
        {
            exitCode,
            stderr,
            originalError,
        }: PgBackupOpenSslFailedExceptionMetadata,
    ) {
        super(
            "Postgres backup openssl encryption failed",
            "PG_BACKUP_OPENSSL_FAILED_EXCEPTION",
            {
                exitCode,
                stderr,
                originalError,
            },
        )
    }
}

