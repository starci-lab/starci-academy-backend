import type {
    UserEntity,
} from "@modules/databases"
import {
    DeepPartial 
} from "typeorm"

/** Cached internal user id by Keycloak subject. */
export type KeycloakUserCacheResult = DeepPartial<UserEntity>
