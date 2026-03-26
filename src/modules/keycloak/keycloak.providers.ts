import {
    Provider,
} from "@nestjs/common"
import Keycloak from "keycloak-js"
import {
    KEYCLOAK,
} from "./constants"
import {
    envConfig 
} from "@modules/env"
import {
    MountStorageService 
} from "@modules/filesystem"

/**
 * Create a Keycloak provider.
 */
export const createKeycloakProvider = (): Provider => (
    {
        provide: KEYCLOAK,
        inject: [MountStorageService],
        useFactory: () => new Keycloak({
            url: envConfig().keycloak.url,
            realm: envConfig().keycloak.realm,
            clientId: envConfig().keycloak.clientId,
        }),
    }
)