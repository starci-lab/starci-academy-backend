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

@Injectable()
/**
 * Every-3h primary product-DB dump. Separate from Keycloak so each dump has its
 * own S3 prefix and failure domain.
 */
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
    @Cron(CronExpression.EVERY_3_HOURS)
    async handleCron() {
        await this.process()
    }
}