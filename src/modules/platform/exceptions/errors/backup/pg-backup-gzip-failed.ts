import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** gzip exit code + stderr so the failed compression step is diagnosable. */
export interface PgBackupGzipFailedExceptionMetadata extends AbstractExceptionMetadata {
    exitCode: unknown
    stderr?: string
}

/** Stops the backup pipeline after gzip fails -- a raw dump is not uploaded as the artifact. */
export class PgBackupGzipFailedException extends AbstractException {
    constructor(
        {
            exitCode,
            stderr,
            originalError,
        }: PgBackupGzipFailedExceptionMetadata,
    ) {
        super(
            "Postgres backup gzip failed",
            "PG_BACKUP_GZIP_FAILED_EXCEPTION",
            {
                exitCode,
                stderr,
                originalError,
            },
        )
    }
}

