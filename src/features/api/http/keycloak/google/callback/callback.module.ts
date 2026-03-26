import {
    Module 
} from "@nestjs/common"
import {
    KeycloakGoogleCallbackService 
} from "./callback.service"
import {
    ConfigurableModuleClass 
} from "./callback.module-definition"
import {
    KeycloakGoogleCallbackController 
} from "./callback.controller"

/**
 * Module for the Keycloak Google callback.
 */
@Module({
    controllers: [KeycloakGoogleCallbackController],
    providers: [
        KeycloakGoogleCallbackService,
    ],
})
export class KeycloakGoogleCallbackModule extends ConfigurableModuleClass {}