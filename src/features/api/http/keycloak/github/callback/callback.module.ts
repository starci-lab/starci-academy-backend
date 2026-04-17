import {
    Module 
} from "@nestjs/common"
import {
    KeycloakGithubCallbackService 
} from "./callback.service"
import {
    ConfigurableModuleClass 
} from "./callback.module-definition"
import {
    KeycloakGithubCallbackController 
} from "./callback.controller"

/**
 * Module for the Keycloak GitHub callback.
 */
@Module({
    controllers: [KeycloakGithubCallbackController],
    providers: [
        KeycloakGithubCallbackService,
    ],
})
export class KeycloakGithubCallbackModule extends ConfigurableModuleClass {}