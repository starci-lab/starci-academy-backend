import {
    CanActivate,
    ExecutionContext,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    KeycloakAuthHeaderInvalidFormatException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-auth-header-invalid-format"
import {
    KeycloakAuthHeaderMissingException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-auth-header-missing"
import {
    KeycloakTokenInactiveException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-token-inactive"
import {
    KeycloakJwksService,
} from "../jwks.service"
import {
    deriveUsername,
} from "../utils/derive-username"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import type {
    KeycloakAuthGuardRequest,
} from "../types/guard"
import type {
    EntityManager,
} from "typeorm"
/**
 * Abstract class for Keycloak authentication guard.
 */
export abstract class AbstractKeycloakAuthGuard implements CanActivate {
    constructor(
        protected readonly keycloakJwksService: KeycloakJwksService,
        @InjectPrimaryPostgreSQLEntityManager()
        protected readonly entityManager: EntityManager,
        protected readonly sessionService: SessionService,
        protected readonly cookieService: CookieService,
    ) { }

    /**
     * Get request from context.
     * @param context - Execution context.
     * @returns Request with user.
     */
    protected abstract getRequest(context: ExecutionContext): KeycloakAuthGuardRequest

    /**
     * Verifies Bearer token, loads or optionally creates user, sets `request.user`.
     */
    async canActivate(
        context: ExecutionContext
    ): Promise<boolean> {
        const request = this.getRequest(context)

        const authHeader = request.headers["authorization"]
        if (!authHeader || typeof authHeader !== "string") {
            throw new KeycloakAuthHeaderMissingException({
            })
        }
        const [
            scheme,
            token,
        ] = authHeader.split(" ")
        if (scheme !== "Bearer" || !token) {
            throw new KeycloakAuthHeaderInvalidFormatException({
            })
        }
        const verified = await this.keycloakJwksService.verifyAccessToken(token)
        if (!verified.active || !verified.sub) {
            throw new KeycloakTokenInactiveException({
            })
        }
        request.keycloakToken = verified
        let user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId: verified.sub,
                },
            },
        )
        if (!user) {
            // create user
            user = this.entityManager.create(
                UserEntity, 
                {
                    keycloakId: verified.sub,
                    // default handle = email local-part (GitHub-style); fall back
                    // to the Keycloak preferred_username when there is no email
                    username: deriveUsername({
                        email: verified.email,
                        fallback: verified.preferred_username,
                    }),
                    email: verified.email,
                    avatar: verified.avatar,
                }
            )
            await this.entityManager.save(user)
        }
        request.user = user
        // enforce single account-wide session: the request must carry the
        // session id that matches the user's current active session
        const sessionId = this.cookieService.getCookie(
            request,
            CookieName.SessionId,
        )
        // throws 401 when a newer login elsewhere has superseded this device
        await this.sessionService.assertCurrent({
            userId: verified.sub,
            sessionId,
        })
        return true
    }
}
