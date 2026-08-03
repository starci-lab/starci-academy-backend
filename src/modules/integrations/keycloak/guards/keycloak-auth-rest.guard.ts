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
    SessionService,
} from "@modules/session"
import {
    CookieService,
} from "@modules/cookie"
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
        sessionService: SessionService,
        cookieService: CookieService,
    ) {
        super(
            keycloakJwksService,
            entityManager,
            sessionService,
            cookieService,
        )
    }

    /**
     * @inheritdoc
     */
    protected getRequest(context: ExecutionContext): KeycloakAuthGuardRequest {
        return context.switchToHttp().getRequest<KeycloakAuthGuardRequest>()
    }
}
