import {
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    KeycloakJwksService,
} from "../jwks.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    AbstractKeycloakAuthGuard,
} from "./abstract"
import type {
    KeycloakAuthGuardRequest,
} from "../types/guard"
import type {
    EntityManager,
} from "typeorm"

@Injectable()
/**
 * Keycloak auth for REST controllers (`Authorization` on the HTTP request).
 */
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
