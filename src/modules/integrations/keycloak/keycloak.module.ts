import {
    DynamicModule,
    Module,
} from "@nestjs/common"

import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./keycloak.module-definition"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakAuthRestGuard,
    KeycloakOptionalAuthGraphQLGuard,
} from "./guards"
import {
    KeycloakJwksService,
} from "./jwks.service"
import {
    KeycloakTokenService,
} from "./token.service"
import {
    KeycloakUserService,
} from "./user.service"
import {
    KeycloakOidcRedirectService,
} from "./keycloak-oidc-redirect.service"

/**
 * Module for verifying Keycloak-issued access tokens (JWT) via realm JWKS.
 */
@Module({
})
export class KeycloakModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)

        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                KeycloakJwksService,
                KeycloakTokenService,
                KeycloakUserService,
                KeycloakOidcRedirectService,
                KeycloakAuthRestGuard,
                KeycloakAuthGraphQLGuard,
                KeycloakOptionalAuthGraphQLGuard,
            ],
            exports: [
                KeycloakJwksService,
                KeycloakTokenService,
                KeycloakUserService,
                KeycloakOidcRedirectService,
                KeycloakAuthRestGuard,
                KeycloakAuthGraphQLGuard,
                KeycloakOptionalAuthGraphQLGuard,
            ],
        }
    }
}

