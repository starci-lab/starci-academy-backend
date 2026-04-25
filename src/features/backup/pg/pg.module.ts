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
export class PgBackupModule extends ConfigurableModuleClass {}

