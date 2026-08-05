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
} from "./login/login.handler"
import {
    KeycloakRegisterHandler,
} from "./register/register.handler"
import {
    KeycloakConfigureMailAdapterHandler,
} from "./configure-mail-adapter/configure-mail-adapter.handler"

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
