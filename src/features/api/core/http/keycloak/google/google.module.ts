import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./google.module-definition"
import {
    KeycloakGoogleCallbackModule,
} from "./callback"

/**
 * Module for the Keycloak Google.
 */
@Module({
    imports: [
        KeycloakGoogleCallbackModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class KeycloakGoogleModule extends ConfigurableModuleClass {}
