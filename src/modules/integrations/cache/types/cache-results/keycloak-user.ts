import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    DeepPartial 
} from "typeorm"

/** Cached internal user id by Keycloak subject. */
export type KeycloakUserCacheResult = DeepPartial<UserEntity>
