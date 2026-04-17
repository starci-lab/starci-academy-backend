import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./github.module-definition"
import {
    KeycloakGithubCallbackModule,
} from "./callback"

/**
 * Module for the Keycloak GitHub.
 */
@Module({
    imports: [
        KeycloakGithubCallbackModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class KeycloakGithubModule extends ConfigurableModuleClass {}