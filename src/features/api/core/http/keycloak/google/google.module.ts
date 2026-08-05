import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./google.module-definition"
import {
    KeycloakGoogleCallbackModule,
} from "./callback/callback.module"
import {
    KeycloakGoogleRedirectModule,
} from "./redirect/redirect.module"

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
/**
 * Module for the Keycloak Google.
 */
export class KeycloakGoogleModule extends ConfigurableModuleClass {}
