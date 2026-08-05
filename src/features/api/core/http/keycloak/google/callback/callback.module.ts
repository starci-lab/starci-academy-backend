import {
    Module,
} from "@nestjs/common"
import {
    KeycloakGoogleCallbackService,
} from "./callback.service"
import {
    ConfigurableModuleClass,
} from "./callback.module-definition"
import {
    KeycloakGoogleCallbackController,
} from "./callback.controller"
import {
    KeycloakGoogleCallbackHandler,
} from "./callback.handler"

@Module({
    controllers: [
        KeycloakGoogleCallbackController,
    ],
    providers: [
        KeycloakGoogleCallbackService,
        KeycloakGoogleCallbackHandler,
    ],
})
/**
 * Wires the Google IdP callback controller + handler so redirect and callback can register
 * independently.
 */
export class KeycloakGoogleCallbackModule extends ConfigurableModuleClass {}
