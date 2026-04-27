/**
 * Query parameters for the GitHub Keycloak callback endpoint.
 */
export interface KeycloakGithubCallbackQuery {
    /**
     * The code parameter received from the GitHub OAuth2 authorization flow.
     */
    code: string
    /**
     * The session state parameter received from the GitHub OAuth2 authorization flow.
     */
    sessionState: string
    /**
     * The issuer parameter received from the GitHub OAuth2 authorization flow.
     */
    iss: string
}