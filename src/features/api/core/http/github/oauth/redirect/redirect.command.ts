/**
 * Params for building the GitHub OAuth redirect URL.
 */
export interface GithubOauthRedirectCommandParams {
    refreshToken: string
    redirectUri: string
}

/**
 * Result of the GitHub OAuth redirect URL building.
 */
export interface GithubOauthRedirectCommandResult {
    url: string
}

/**
 * CQRS command for validating refresh token and producing the GitHub authorize redirect URL.
 */
export class GithubOauthRedirectCommand {
    constructor(
        public readonly params: GithubOauthRedirectCommandParams,
    ) {}
}

