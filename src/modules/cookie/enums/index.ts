/**
 * Enum of cookie names.
 */
export enum CookieName {
    /** The name of the refresh token cookie. */
    KeycloakRefreshToken = "keycloak_refresh_token",
    /** The name of the CSRF double-submit token cookie (JS-readable, not HttpOnly). */
    CsrfToken = "csrf_token",
    /** The name of the single-session id cookie (HttpOnly, bound to the active session). */
    SessionId = "session_id",
}