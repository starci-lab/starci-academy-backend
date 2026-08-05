import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./redirect.module-definition"
import {
    KeycloakGithubRedirectController,
} from "./redirect.controller"

@Module({
    controllers: [
        KeycloakGithubRedirectController,
    ],
})
/**
 * Wires only the GitHub IdP start controller — no handler, because Keycloak owns the
 * authorize round-trip.
 */
export class KeycloakGithubRedirectModule extends ConfigurableModuleClass {}

