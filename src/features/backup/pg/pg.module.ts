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
    ConfigurableModuleClass,
} from "./pg.module-definition"

@Module({
    providers: [
        KeycloakBackupService,
        PrimaryBackupService,
    ],
})
export class PgBackupModule extends ConfigurableModuleClass {}

