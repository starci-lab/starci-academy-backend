/**
 * The parameters for building the GitHub OAuth authorization URL.
 */
export interface BuildGithubAuthorizeRedirectUrlParams {
    /**
     * The scope for the GitHub OAuth authorization.
     */
    scope?: string
    /**
     * The state for the GitHub OAuth authorization.
     */
    state: string
}

/**
 * Params for exchanging an OAuth `code` for a GitHub user access token.
 */
export interface ExchangeGithubOAuthCodeForAccessTokenParams {
    /** The short-lived OAuth authorization `code` returned by GitHub's redirect. */
    code: string
}

/**
 * Result of exchanging an OAuth `code` for a GitHub user access token.
 */
export interface ExchangeGithubOAuthCodeForAccessTokenResult {
    /** The GitHub user access token obtained from the code exchange. */
    accessToken: string
}

/**
 * Params for fetching the authenticated GitHub user profile.
 */
export interface GetGithubAuthenticatedUserParams {
    /** The GitHub user access token used to authenticate the profile request. */
    accessToken: string
}

/**
 * Minimal GitHub user profile shape we need for account linking.
 */
export interface GithubAuthenticatedUser {
    /** The GitHub username (login handle) used for account linking. */
    login: string
}

/**
 * Result of fetching the authenticated GitHub user profile.
 */
export interface GetGithubAuthenticatedUserResult {
    /** The fetched authenticated GitHub user profile. */
    user: GithubAuthenticatedUser
}

