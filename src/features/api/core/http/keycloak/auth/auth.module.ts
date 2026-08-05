import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./auth.module-definition"
import {
    KeycloakAuthController,
} from "./auth.controller"
import {
    KeycloakAuthService,
} from "./auth.service"
import {
    KeycloakLoginHandler,
} from "./login"
import {
    KeycloakRegisterHandler,
} from "./register"
import {
    KeycloakConfigureMailAdapterHandler,
} from "./configure-mail-adapter"

@Module({
    controllers: [
        KeycloakAuthController,
    ],
    providers: [
        KeycloakAuthService,
        KeycloakLoginHandler,
        KeycloakRegisterHandler,
        KeycloakConfigureMailAdapterHandler,
    ],
})
/**
 * Wires REST auth handlers so login/register/mail-adapter stay out of the GraphQL Keycloak
 * mutation tree.
 */
export class KeycloakAuthModule extends ConfigurableModuleClass {}
