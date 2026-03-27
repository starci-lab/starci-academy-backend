import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common"

import {
    KeycloakTokenService,
} from "./token.service"
import {
    UserEntity,
} from "@modules/databases"
import {
    InjectPrimaryPostgresqlEntityManager,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"

/**
 * Guard that verifies Keycloak-issued access tokens (JWT) via realm JWKS.
 */
@Injectable()
export class KeycloakAuthGuard implements CanActivate {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        @InjectPrimaryPostgresqlEntityManager()
        private readonly entityManager: EntityManager,
    ) { }
    
    /**
     * Can activate.
     * @param context - Execution context.
     * @returns Promise of boolean.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Extract request and Authorization header.
        const http = context.switchToHttp()
        const request = http.getRequest()

        // Validate Authorization header format.
        const authHeader = request.headers["authorization"]
        if (!authHeader || typeof authHeader !== "string") {
            throw new UnauthorizedException("Missing Authorization header")
        }

        // Parse Bearer token.
        const [scheme,
            token] = authHeader.split(" ")
        if (scheme !== "Bearer" || !token) {
            throw new UnauthorizedException("Invalid Authorization header format")
        }
        // Verify token and attach claims to request context.
        const verified = await this.keycloakTokenService.verifyAccessToken(token)
        // Retrieve the user by the keycloak id
        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId: verified.sub,
                },
            }
        )
        if (!user) {
            throw new UnauthorizedException("User not found")
        }
        request.user = user
        return true
    }
}

