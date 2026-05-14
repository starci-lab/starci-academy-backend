import {
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakJwksService,
} from "../jwks.service"
import type {
    KeycloakAuthGuardRequest,
} from "../types"
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
            throw new UnauthorizedException("Missing Authorization header")
        }
        const [
            scheme,
            token,
        ] = authHeader.split(" ")
        if (scheme !== "Bearer" || !token) {
            throw new UnauthorizedException("Invalid Authorization header format")
        }
        const verified = await this.keycloakJwksService.verifyAccessToken(token)
        if (!verified.active || !verified.sub) {
            throw new UnauthorizedException("Invalid or inactive token")
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
                    username: verified.preferred_username,
                    email: verified.email,
                    avatar: verified.avatar,
                }
            )
            await this.entityManager.save(user)
        }
        request.user = user
        return true
    }
}
