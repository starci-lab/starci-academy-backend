import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./redirect.module-definition"
import {
    KeycloakGoogleRedirectController,
} from "./redirect.controller"

@Module({
    controllers: [
        KeycloakGoogleRedirectController,
    ],
})
/**
 * Wires only the Google IdP start controller -- no handler, because Keycloak owns the
 * authorize round-trip.
 */
export class KeycloakGoogleRedirectModule extends ConfigurableModuleClass {}

