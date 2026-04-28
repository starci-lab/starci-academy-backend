import type {
    RefreshTokenRequest 
} from "./graphql-types"

export interface RefreshTokenCommandParams {
    refreshToken: string
    /**
     * Current access token (JWT); used with {@link minValiditySeconds} only.
     */
    accessToken?: string
    /**
     * Request for refreshing Keycloak tokens.
     */
    request: RefreshTokenRequest
}

export class RefreshTokenCommand {
    constructor(
        readonly params: RefreshTokenCommandParams,
    ) {}
}

