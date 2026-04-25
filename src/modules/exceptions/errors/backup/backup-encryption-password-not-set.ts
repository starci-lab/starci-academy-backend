import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface BackupEncryptionPasswordNotSetExceptionMetadata extends AbstractExceptionMetadata {
    envPath?: string
}

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

