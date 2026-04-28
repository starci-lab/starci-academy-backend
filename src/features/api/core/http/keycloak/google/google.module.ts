import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./google.module-definition"
import {
    KeycloakGoogleCallbackModule,
} from "./callback"
import {
    KeycloakGoogleRedirectModule,
} from "./redirect"

/**
 * Module for the Keycloak Google.
 */
@Module({
    imports: [
        KeycloakGoogleRedirectModule.register(
            {
                isGlobal: true,
            }
        ),
        KeycloakGoogleCallbackModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class KeycloakGoogleModule extends ConfigurableModuleClass {}
