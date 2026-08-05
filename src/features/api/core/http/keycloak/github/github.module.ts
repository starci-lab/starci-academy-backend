import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./github.module-definition"
import {
    KeycloakGithubCallbackModule,
} from "./callback/callback.module"
import {
    KeycloakGithubRedirectModule,
} from "./redirect/redirect.module"

@Module({
    imports: [
        KeycloakGithubRedirectModule.register(
            {
                isGlobal: true,
            }
        ),
        KeycloakGithubCallbackModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
/**
 * Module for the Keycloak GitHub.
 */
export class KeycloakGithubModule extends ConfigurableModuleClass {}