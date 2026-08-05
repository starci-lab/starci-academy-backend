import {
    Module
} from "@nestjs/common"
import {
    KeycloakBackupService
} from "./keycloak.service"
import {
    PrimaryBackupService
} from "./primary.service"
import {
    PgBackupService 
} from "./pg.service"
import {
    ConfigurableModuleClass,
} from "./pg.module-definition"

@Module({
    providers: [
        PgBackupService,
        KeycloakBackupService,
        PrimaryBackupService,
    ],
})
/**
 * Dump/encrypt/upload pipeline plus Keycloak and primary cron wrappers. Split
 * from `BackupModule` so a future non-PG target can sit alongside without
 * pulling `pg_dump`.
 */
export class PgBackupModule extends ConfigurableModuleClass {}

