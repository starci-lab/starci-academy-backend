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
export class KeycloakGithubCallbackModule extends ConfigurableModuleClass {}
