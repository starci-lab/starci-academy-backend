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
 * Every-3h Keycloak PG dump. Isolated from primary so an IdP dump failure
 * cannot skip the product DB (and vice versa). Prefix `keycloak-backups` keeps
 * restore paths unambiguous.
 */
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
        await this.pgBackupService.backup(
            {
                postgresUrl: sourceUrl,
                s3KeyPrefix: "keycloak-backups",
                artifactBaseName: "keycloak-backup",
            }
        )
    }

    /**
     * Handle the cron job.
     */
    @Cron(CronExpression.EVERY_3_HOURS)
    async handleCron() {
        await this.process()
    }
}