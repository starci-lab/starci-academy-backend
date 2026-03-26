import {
    Injectable,
    UnauthorizedException,
} from "@nestjs/common"
import {
    KeycloakJwtClaims,
    KeycloakJwtDecodedComplete,
    VerifiedKeycloakToken,
} from "./types"
import {
    InjectKeycloak 
} from "./keycloak.decorators"
import Keycloak from "keycloak-js"

/**
 * Service responsible for verifying Keycloak-issued access tokens (JWT) via realm JWKS.
 */
@Injectable()
export class KeycloakService {
    constructor(
        @InjectKeycloak()
        private readonly keycloak: Keycloak,
    ) { }

    private async verifyAccessToken(token: string): Promise<VerifiedKeycloakToken> {
        return this.keycloak.(token)
    }
}

