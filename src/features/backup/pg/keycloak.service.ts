import {
    Injectable 
} from "@nestjs/common"
import {
    S3Provider, S3UploadService 
} from "@modules/s3"
import {
    ExecaService 
} from "@modules/execa"
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
    Cron,
    CronExpression 
} from "@nestjs/schedule"

/**
 * Service for backing up Keycloak database.
 */
@Injectable()
export class KeycloakBackupService {
    /**
     * Constructor.
     * @param s3UploadService - S3 upload service.
     * @param execaService - Execa service.
     */
    constructor(
        private readonly s3UploadService: S3UploadService,
        private readonly execaService: ExecaService,
    ) {}

    /**
     * Process the backup.
     */
    async process(): Promise<void> {
        const {
            username,
            password,
            host,
            port,
            database,
        } = envConfig().databases.postgresql.keycloak

        const sourceUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`

        // 1. Create temp dir
        const tempDir = await mkdtemp(
            path.join(tmpdir(),
                "keycloak-backup-"),
        )

        const dumpPath = path.join(tempDir,
            "backup.dump")

        try {
            // 2. Dump the database
            await this.execaService.exec({
                command: "pg_dump",
                args: [
                    "--format=custom",
                    "--file",
                    dumpPath,
                    "--dbname",
                    sourceUrl,
                ],
                timeoutMs: 30000,
            })

            // 3. Upload to S3
            await this.s3UploadService.buffer(
                {
                    buffer: await readFile(dumpPath),
                    name: `keycloak-backups/${Date.now()}.dump`,
                    acl: "private",
                    provider: S3Provider.DigitalOcean,
                }
            )

        } finally {
            // 4. Cleanup temp dir
            await rm(
                tempDir,
                {
                    recursive: true, force: true 
                }
            )
        }
    }

    /**
     * Handle the cron job.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleCron() {
        await this.process()
    }
}