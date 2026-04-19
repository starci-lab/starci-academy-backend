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
export class KeycloakGoogleCallbackModule extends ConfigurableModuleClass {}
