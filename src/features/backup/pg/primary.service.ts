import {
    Injectable 
} from "@nestjs/common"
import {
    envConfig 
} from "@modules/env"
import {
    Cron, 
    CronExpression 
} from "@nestjs/schedule"
import {
    PgBackupService 
} from "./pg.service"

/**
 * Service for backing up Primary database.
 */
@Injectable()
export class PrimaryBackupService {
    /**
     * Constructor.
     * @param pgBackupService - Common PG backup service.
     */
    constructor(
        private readonly pgBackupService: PgBackupService,
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
        } = envConfig().databases.postgresql.primary

        const sourceUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`
        await this.pgBackupService.backup({
            postgresUrl: sourceUrl,
            s3KeyPrefix: "primary-backups",
            artifactBaseName: "primary-backup",
        })
    }
    
    /**
     * Handle the cron job.
     */
    @Cron(CronExpression.EVERY_30_SECONDS)
    async handleCron() {
        await this.process()
    }
}