import {
    Module,
} from "@nestjs/common"
import {
    KeycloakGithubCallbackService,
} from "./callback.service"
import {
    ConfigurableModuleClass,
} from "./callback.module-definition"
import {
    KeycloakGithubCallbackController,
} from "./callback.controller"
import {
    KeycloakGithubCallbackHandler,
} from "./callback.handler"

@Module({
    controllers: [
        KeycloakGithubCallbackController,
    ],
    providers: [
        KeycloakGithubCallbackService,
        KeycloakGithubCallbackHandler,
    ],
})
/**
 * Wires the GitHub IdP callback controller + handler so redirect and callback can register
 * independently.
 */
export class KeycloakGithubCallbackModule extends ConfigurableModuleClass {}
