import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface PgBackupGzipFailedExceptionMetadata extends AbstractExceptionMetadata {
    exitCode: unknown
    stderr?: string
}

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

