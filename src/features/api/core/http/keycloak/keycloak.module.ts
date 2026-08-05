import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./keycloak.module-definition"
import {
    KeycloakGoogleModule,
} from "./google/google.module"
import {
    KeycloakGithubModule,
} from "./github/github.module"
import {
    KeycloakAuthModule,
} from "./auth/auth.module"

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
