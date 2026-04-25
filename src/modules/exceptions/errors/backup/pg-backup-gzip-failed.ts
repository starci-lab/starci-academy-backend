import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface PgBackupGzipFailedExceptionMetadata extends AbstractExceptionMetadata {
    exitCode: unknown
}

export class PgBackupGzipFailedException extends AbstractException {
    constructor(
        {
            exitCode,
            originalError,
        }: PgBackupGzipFailedExceptionMetadata,
    ) {
        super(
            "Postgres backup gzip failed",
            "PG_BACKUP_GZIP_FAILED_EXCEPTION",
            {
                exitCode,
                originalError,
            },
        )
    }
}

