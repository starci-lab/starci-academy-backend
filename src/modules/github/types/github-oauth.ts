/**
 * Params for exchanging an OAuth `code` for a GitHub user access token.
 */
export interface ExchangeGithubOAuthCodeForAccessTokenParams {
    code: string
}

/**
 * Result of exchanging an OAuth `code` for a GitHub user access token.
 */
export interface ExchangeGithubOAuthCodeForAccessTokenResult {
    accessToken: string
}

/**
 * Params for fetching the authenticated GitHub user profile.
 */
export interface GetGithubAuthenticatedUserParams {
    accessToken: string
}

/**
 * Minimal GitHub user profile shape we need for account linking.
 */
export interface GithubAuthenticatedUser {
    login: string
}

/**
 * Result of fetching the authenticated GitHub user profile.
 */
export interface GetGithubAuthenticatedUserResult {
    user: GithubAuthenticatedUser
}

