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
import {
    KeycloakAuthModule,
} from "./auth"

@Module({
    imports: [
        KeycloakGoogleModule.register({
            isGlobal: true,
        }),
        KeycloakGithubModule.register({
            isGlobal: true,
        }),
        KeycloakAuthModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Module for the Keycloak.
 */
export class KeycloakModule extends ConfigurableModuleClass {}
