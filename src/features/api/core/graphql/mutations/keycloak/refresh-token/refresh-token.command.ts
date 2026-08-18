import type {
    RefreshTokenRequest,
} from "./graphql-types/request"

/**
 * Cookie + optional bearer inputs for refresh. The refresh token is not on the
 * GraphQL input -- it arrives from the httpOnly cookie so XSS cannot steal it.
 */
export interface RefreshTokenParams {
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

/** CQRS envelope for refresh so coalescing/rotation stays off the resolver. */
export class RefreshTokenCommand {
    constructor(
        readonly params: RefreshTokenParams,
    ) {}
}

