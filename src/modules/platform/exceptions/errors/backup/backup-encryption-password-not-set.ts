import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Env path that should have held the backup encryption password. */
export interface BackupEncryptionPasswordNotSetExceptionMetadata extends AbstractExceptionMetadata {
    envPath?: string
}

/** Aborts backup before dump -- an unencrypted artifact must never be uploaded. */
export class BackupEncryptionPasswordNotSetException extends AbstractException {
    constructor(
        {
            envPath = "backup.encrypt.password",
            originalError,
        }: BackupEncryptionPasswordNotSetExceptionMetadata,
    ) {
        super(
            "Backup encryption password is not set",
            "BACKUP_ENCRYPTION_PASSWORD_NOT_SET_EXCEPTION",
            {
                envPath,
                originalError,
            },
        )
    }
}

