import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common"

import {
    KeycloakService,
} from "./keycloak.service"

import type {
    KeycloakRequest,
} from "./types"

@Injectable()
/**
 * Guard that verifies Keycloak-issued access tokens (JWT) via realm JWKS.
 */
export class KeycloakAuthGuard implements CanActivate {
    constructor(
        private readonly keycloak: KeycloakService,
    ) { }
    
    /**
     * Can activate.
     * @param context - Execution context.
     * @returns Promise of boolean.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Extract request and Authorization header.
        const http = context.switchToHttp()
        const request = http.getRequest<KeycloakRequest>()

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
        const verified = await this.keycloak.verifyAccessToken(token)
        request.keycloak = verified
        return true
    }
}

