import {
    Injectable 
} from "@nestjs/common"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3UploadService,
} from "@modules/integrations/s3/s3-upload.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    mkdtemp, 
    rm 
} from "fs/promises"
import path from "path"
import {
    tmpdir 
} from "os"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    BackupEncryptionPasswordNotSetException,
} from "@modules/platform/exceptions/errors/backup/backup-encryption-password-not-set"
import {
    ExecaService,
} from "@modules/integrations/execa/execa.service"
import {
    createReadStream
} from "fs"
import type {
    PgBackupParams,
} from "./types/pg-backup"

@Injectable()
/**
 * Production-only dump -> gzip -> openssl -> private DO upload. Skips outside
 * production so local/dev never write encrypted dumps with a missing/shared
 * password. Throws if `BACKUP_ENCRYPT_PASSWORD` is unset rather than uploading
 * plaintext.
 */
export class PgBackupService {
    constructor(
        private readonly s3UploadService: S3UploadService,
        private readonly execaService: ExecaService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Backup the PostgreSQL database.
     * @param postgresUrl - The URL of the PostgreSQL database.
     * @param s3KeyPrefix - The prefix of the S3 key.
     * @param artifactBaseName - The base name of the artifact.
     */
    async backup({
        postgresUrl,
        s3KeyPrefix,
        artifactBaseName,
    }: PgBackupParams): Promise<void> {

        if (!envConfig().isProduction) return

        const encryptPassword = envConfig().backup.encrypt.password
        if (!encryptPassword) {
            throw new BackupEncryptionPasswordNotSetException({
            })
        }

        const tempDir = await mkdtemp(
            path.join(tmpdir(),
                `${artifactBaseName}-`)
        )

        const dumpPath = path.join(tempDir,
            `${artifactBaseName}.dump`)
        const gzPath = `${dumpPath}.gz`
        const encPath = `${gzPath}.enc`
        const s3Key = `${s3KeyPrefix}/${Date.now()}.dump.gz.enc`
        try {
            // 1. pg_dump -> file
            await this.execaService.exec({
                command: "pg_dump",
                args: [
                    "--format=custom",
                    "--file",
                    dumpPath,
                    "--dbname",
                    postgresUrl,
                ],
            })
            // 2. gzip (stream stdout -> file; avoid buffering large outputs)
            await this.execaService.execToFile({
                command: "gzip",
                args: [
                    "-c",
                    dumpPath,
                ],
                stdoutPath: gzPath,
                timeoutMs: 10 * 60 * 1000,
            })
            // 3. openssl encrypt
            await this.execaService.exec({
                command: "openssl",
                args: [
                    "enc",
                    "-aes-256-cbc",
                    "-salt",
                    "-pbkdf2",
                    "-in",
                    gzPath,
                    "-out",
                    encPath,
                    "-pass",
                    "env:BACKUP_ENCRYPT_PASSWORD",
                ],
                timeoutMs: 10 * 60 * 1000,
                env: {
                    // spawn inherit: openssl reads BACKUP_ENCRYPT_PASSWORD from the
                    // child env; spreading process.env is not a config read.
                    // eslint-disable-next-line no-restricted-syntax
                    ...process.env,
                    BACKUP_ENCRYPT_PASSWORD: encryptPassword,
                },
            })

            // 4. upload S3
            await this.s3UploadService.stream(
                {
                    name: s3Key,
                    stream: createReadStream(encPath),
                    acl: "private",
                    provider: S3Provider.DigitalOcean,
                }
            )

            this.winstonService.log(
                WinstonLog.PgBackupCompletedSuccessfully,
                {
                    name: artifactBaseName,
                    s3Key,
                },
            )

        } catch (error) {
            this.winstonService.log(
                WinstonLog.PgBackupFailed,
                {
                    name: artifactBaseName,
                    s3KeyPrefix,
                    error: error.message,
                },
            )
        } finally {
            await rm(
                tempDir,
                {
                    recursive: true,
                    force: true,
                }
            )
        }
    }
}