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
    execa 
} from "execa"
import {
    WinstonLog, WinstonService 
} from "@modules/winston"
import {
    BackupEncryptionPasswordNotSetException,
} from "@modules/exceptions"

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
            await execa("pg_dump",
                [
                    "--format=custom",
                    "--file",
                    dumpPath,
                    "--dbname",
                    postgresUrl,
                ])

            // 2. gzip → FIXED (output file phải redirect)
            await execa("gzip",
                [
                    "-f",
                    dumpPath, // tạo dump.gz
                ])

            // 3. openssl encrypt
            await execa("openssl",
                [
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
                {
                    env: {
                        ...process.env,
                        BACKUP_ENCRYPT_PASSWORD: encryptPassword,
                    },
                })

            // 4. upload S3
            await this.s3UploadService.buffer({
                buffer: await readFile(encPath),
                name: s3Key,
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
                    error: error instanceof Error ? error.message : String(error),
                },
            )
            throw error
        } finally {
            await rm(tempDir,
                {
                    recursive: true,
                    force: true,
                })
        }
    }
}