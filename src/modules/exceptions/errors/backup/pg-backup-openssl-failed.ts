import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface PgBackupOpenSslFailedExceptionMetadata extends AbstractExceptionMetadata {
    exitCode: unknown
    stderr?: string
}

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

