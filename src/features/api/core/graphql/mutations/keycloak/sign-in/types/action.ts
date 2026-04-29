/** Payload for sign in action. */
export interface SignInActionPayload {
    /** Email of the user. */
    email: string
    /** Keycloak access token obtained after credential check. */
    accessToken: string
    /** Keycloak refresh token obtained after credential check. */
    refreshToken: string
}