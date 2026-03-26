import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./http.module-definition"
import {
    KeycloakModule,
} from "./keycloak"

/**
 * Module for the HTTP.
 */
@Module({
    imports: [
        KeycloakModule.register({
            isGlobal: true,
        }),
    ],
})
export class HttpModule extends ConfigurableModuleClass {}
