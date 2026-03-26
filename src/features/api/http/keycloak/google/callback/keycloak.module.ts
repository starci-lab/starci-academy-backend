import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "../keycloak.module-definition"

@Module({
    imports: [
    ],
})
export class KeycloakModule extends ConfigurableModuleClass {}
