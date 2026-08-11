/**
 * Params for handling the GitHub OAuth callback.
 */
export interface GithubOauthCallbackCommandParams {
    code: string
    state: string
}

/**
 * Decrypted state payload encoded by `github/oauth/redirect`.
 */
export interface GithubOauthCallbackStatePayload {
    nonce: string
}

/** Server-side account and return target bound to a one-time GitHub state. */
export interface GithubOauthCallbackBoundState {
    redirectUri: string
    userId: string
}

/**
 * Normalized JSON response from GitHub `access_token` exchange.
 * (Keycloak/endpoint may return query-string; we parse that separately.)
 */
export interface GithubOauthAccessTokenResponse {
    access_token?: string
}

/**
 * Minimal GitHub user profile shape we need.
 */
export interface GithubOauthApiUserResponse {
    login?: string
}

/**
 * Result of the GitHub OAuth callback.
 */
export interface GithubOauthCallbackResult {
    redirectUri: string
}

/**
 * CQRS command for processing GitHub OAuth callback.
 */
export class GithubOauthCallbackCommand {
    constructor(
        public readonly params: GithubOauthCallbackCommandParams,
    ) {}
}

