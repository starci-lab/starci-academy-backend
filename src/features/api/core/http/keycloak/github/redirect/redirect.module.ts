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
export class KeycloakGithubRedirectModule extends ConfigurableModuleClass {}

