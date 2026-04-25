import {
    Injectable 
} from "@nestjs/common"
import {
    S3UploadService, S3Provider 
} from "@modules/s3"
import {
    envConfig 
} from "@modules/env"
import {
    mkdtemp, readFile, rm 
} from "node:fs/promises"
import path from "path"
import {
    tmpdir 
} from "os"
import {
    WinstonLog, WinstonService 
} from "@modules/winston"
import {
    BackupEncryptionPasswordNotSetException,
} from "@modules/exceptions"
import {
    ExecaService
} from "@modules/execa"
import { createReadStream } from "node:fs"

export interface PgBackupParams {
    postgresUrl: string
    s3KeyPrefix: string
    artifactBaseName: string
}

/**
 * Service for backing up PostgreSQL databases.
 */
@Injectable()
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
            // 1. pg_dump → file
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
            // 2. gzip (stream stdout → file; avoid buffering large outputs)
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
                    ...process.env,
                    BACKUP_ENCRYPT_PASSWORD: encryptPassword,
                },
            })

            // 4. upload S3
            await this.s3UploadService.stream({
                name: s3Key,
                stream: createReadStream(encPath),
                acl: "private",
                provider: S3Provider.DigitalOcean,
            })

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