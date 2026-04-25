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
 * Service for backing up Keycloak database.
 */
@Injectable()
export class KeycloakBackupService {
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
        } = envConfig().databases.postgresql.keycloak

        const sourceUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`
        await this.pgBackupService.backup({
            postgresUrl: sourceUrl,
            s3KeyPrefix: "keycloak-backups",
            artifactBaseName: "keycloak-backup",
        })
    }

    /**
     * Handle the cron job.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleCron() {
        await this.process()
    }
}