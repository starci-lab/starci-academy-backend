import {
    DynamicModule,
    Module,
} from "@nestjs/common"

import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./keycloak.module-definition"

import {
    KeycloakService,
} from "./keycloak.service"

import {
    KeycloakAuthGuard,
} from "./keycloak-auth.guard"

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
                KeycloakService,
                KeycloakAuthGuard,
            ],
            exports: [
                KeycloakService,
                KeycloakAuthGuard,
            ],
        }
    }
}

