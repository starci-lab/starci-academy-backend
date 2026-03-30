import {
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    KeycloakJwksService,
} from "../jwks.service"
import {
    AbstractKeycloakAuthGuard,
} from "./abstract"
import type {
    KeycloakAuthGuardRequest,
} from "../types"
import type {
    EntityManager,
} from "typeorm"

/**
 * Keycloak auth for REST controllers (`Authorization` on the HTTP request).
 */
@Injectable()
export class KeycloakAuthRestGuard extends AbstractKeycloakAuthGuard {
    constructor(
        keycloakJwksService: KeycloakJwksService,
        @InjectPrimaryPostgreSQLEntityManager()
        entityManager: EntityManager,
    ) {
        super(
            keycloakJwksService,
            entityManager,
        )
    }

    /**
     * @inheritdoc
     */
    protected getRequest(context: ExecutionContext): KeycloakAuthGuardRequest {
        return context.switchToHttp().getRequest<KeycloakAuthGuardRequest>()
    }
}
