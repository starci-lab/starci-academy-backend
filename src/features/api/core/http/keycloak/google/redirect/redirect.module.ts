import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./redirect.module-definition"
import {
    KeycloakGoogleRedirectController,
} from "./redirect.controller"

@Module({
    controllers: [
        KeycloakGoogleRedirectController,
    ],
})
export class KeycloakGoogleRedirectModule extends ConfigurableModuleClass {}

