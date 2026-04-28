import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./github.module-definition"
import {
    KeycloakGithubCallbackModule,
} from "./callback"
import {
    KeycloakGithubRedirectModule,
} from "./redirect"

/**
 * Module for the Keycloak GitHub.
 */
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
export class KeycloakGithubModule extends ConfigurableModuleClass {}