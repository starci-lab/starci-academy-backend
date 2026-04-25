import {
    Injectable 
} from "@nestjs/common"
import {
    S3Provider,
    S3UploadService 
} from "@modules/s3"
import {
    ExecaService 
} from "@modules/execa"
import {
    envConfig 
} from "@modules/env"
import {
    mkdtemp,
    readFile,
    rm 
} from "node:fs/promises"
import {
    createWriteStream 
} from "node:fs"
import path from "path"
import {
    tmpdir 
} from "os"
import {
    spawn 
} from "node:child_process"
import {
    pipeline 
} from "node:stream/promises"
import { 
    WinstonLog,
    WinstonService 
} from "@modules/winston"
import {
    BackupEncryptionPasswordNotSetException,
    PgBackupGzipFailedException,
} from "@modules/exceptions"

/**
 * Parameters for backing up a PostgreSQL database.
 */
export interface PgBackupParams {
    /**
     * The URL of the PostgreSQL database to backup.
     */
    postgresUrl: string
    /**
     * The prefix for the S3 key.
     */
    s3KeyPrefix: string
    /**
     * The base name for the artifact.
     */
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
     * Backup a PostgreSQL database.
     * @param params - The parameters for the backup.
     * @returns void
     */
    async backup(
        {
            postgresUrl,
            s3KeyPrefix,
            artifactBaseName,
        }: PgBackupParams,
    ): Promise<void> {
        console.log("backup",
            {
                postgresUrl,
                s3KeyPrefix,
                artifactBaseName,
            })
        console.log("isProduction",
            envConfig().isProduction)
        if (!envConfig().isProduction) {
            return
        }
        const encryptPassword = envConfig().backup.encrypt.password
        if (!encryptPassword) {
            throw new BackupEncryptionPasswordNotSetException({
            })
        }
        const tempDir = await mkdtemp(
            path.join(
                tmpdir(),
                `${artifactBaseName}-`,
            ),
        )
        console.log("tempDir",
            tempDir)
        const dumpPath = path.join(
            tempDir,
            `${artifactBaseName}.dump`,
        )
        console.log("dumpPath",
            dumpPath)
        const gzPath = `${dumpPath}.gz`
        const encPath = `${gzPath}.enc`
        try {
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
            console.log("gzip",
                {
                    command: "gzip",
                    args: [
                        "-c",
                        dumpPath,
                    ],
                })
            const gzip = spawn(
                "gzip",
                [
                    "-c",
                    dumpPath,
                ],
                {
                    stdio: [
                        "ignore",
                        "pipe",
                        "pipe",
                    ],
                },
            )
            console.log("pipeline",
                {
                    stdout: gzip.stdout,
                    gzPath,
                })
            await pipeline(
                gzip.stdout,
                createWriteStream(gzPath),
            )   
            const gzipExitCode = await new Promise((resolve, reject) => {
                gzip.once(
                    "error",
                    reject,
                )
                gzip.once(
                    "close",
                    resolve,
                )
            })
            console.log("gzipExitCode", gzipExitCode)
            if (gzipExitCode !== 0) {
                throw new PgBackupGzipFailedException({
                    exitCode: gzipExitCode,
                })
            }
            const openssl = spawn(
                "openssl",
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
                    stdio: [
                        "ignore",
                        "ignore",
                        "pipe",
                    ],
                    env: {
                        ...process.env,
                        BACKUP_ENCRYPT_PASSWORD: encryptPassword,
                    },
                },
            )
            console.log("openssl", {
                command: "openssl",
                args: [
                    "enc",
                    "-aes-256-cbc",
                    "-salt",
                    "-pbkdf2",
                ],
            })
            const opensslStderr: Array<Buffer> = []
            openssl.stderr?.on(
                "data",
                (chunk: Buffer) => opensslStderr.push(chunk),
            )
            const opensslExitCode = await new Promise((resolve, reject) => {
                openssl.once(
                    "error",
                    reject,
                )
                openssl.once(
                    "close",
                    resolve,
                )
            })
            if (opensslExitCode !== 0) {
                const stderr = Buffer.concat(opensslStderr).toString("utf8").trim()
                throw new Error(`openssl failed with exit code ${opensslExitCode}${stderr
                    ? `: ${stderr}`
                    : ""}`)
            }

            await this.s3UploadService.buffer({
                buffer: await readFile(encPath),
                name: `${s3KeyPrefix}/${Date.now()}.dump.gz.enc`,
                acl: "private",
                provider: S3Provider.DigitalOcean,
            })
            this.winstonService.log(
                WinstonLog.PgBackupCompletedSuccessfully,
                {
                    name: artifactBaseName,
                    s3Key: `${s3KeyPrefix}/${Date.now()}.dump.gz.enc`,
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
                },
            )
        }
    }
}

