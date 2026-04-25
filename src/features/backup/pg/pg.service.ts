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
        if (!envConfig().isProduction) {
            return
        }
        const encryptPassword = envConfig().backup.encrypt.password
        if (!encryptPassword) {
            throw new Error("BACKUP_ENCRYPT_PASSWORD is required for encrypted backups.")
        }

        const tempDir = await mkdtemp(
            path.join(
                tmpdir(),
                `${artifactBaseName}-`,
            ),
        )

        const dumpPath = path.join(
            tempDir,
            `${artifactBaseName}.dump`,
        )
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
                timeoutMs: 30000,
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
            await pipeline(
                gzip.stdout,
                createWriteStream(gzPath),
            )
            const gzipExitCode: number = await new Promise((resolve, reject) => {
                gzip.once(
                    "error",
                    reject,
                )
                gzip.once(
                    "close",
                    resolve,
                )
            })
            if (gzipExitCode !== 0) {
                throw new Error(`gzip failed with exit code ${gzipExitCode}`)
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
            const opensslStderr: Array<Buffer> = []
            openssl.stderr?.on(
                "data",
                (chunk: Buffer) => opensslStderr.push(chunk),
            )
            const opensslExitCode: number = await new Promise((resolve, reject) => {
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

