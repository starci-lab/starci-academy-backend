import {
    DynamicModule,
    Module,
} from "@nestjs/common"

import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./keycloak.module-definition"
import {
    KeycloakAuthGuard,
} from "./keycloak-auth.guard"
import {
    KeycloakTokenService
} from "./token.service"

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
                KeycloakTokenService,
                KeycloakAuthGuard,
            ],
            exports: [
                KeycloakTokenService,
                KeycloakAuthGuard,
            ],
        }
    }
}

