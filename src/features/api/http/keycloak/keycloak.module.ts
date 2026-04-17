import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./keycloak.module-definition"
import {
    KeycloakGoogleModule,
} from "./google"
import {
    KeycloakGithubModule,
} from "./github"

/**
 * Module for the Keycloak.
 */
@Module({
    imports: [
        KeycloakGoogleModule.register({
            isGlobal: true,
        }),
        KeycloakGithubModule.register({
            isGlobal: true,
        }),
    ],
})
export class KeycloakModule extends ConfigurableModuleClass {}
