/**
 * Query parameters for the Google Keycloak callback endpoint.
 */
export interface KeycloakGoogleCallbackQuery {
    /**
     * The code parameter received from the Google OAuth2 authorization flow.
     */
    code: string
    /**
     * The session state parameter received from the Google OAuth2 authorization flow.
     */
    sessionState: string
    /**
     * The issuer parameter received from the Google OAuth2 authorization flow.
     */
    iss: string
}