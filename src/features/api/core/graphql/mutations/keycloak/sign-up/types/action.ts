/** Payload for sign up action. */
export interface SignUpActionPayload {
    /** Keycloak user id (created at init, unverified until OTP completes). */
    keycloakUserId: string
    /** Email of the user. */
    email: string
    /** Password of the user. */
    password: string
    /** Username of the user. */
    username?: string
    /** First name of the user. */
    firstName?: string
    /** Last name of the user. */
    lastName?: string
}