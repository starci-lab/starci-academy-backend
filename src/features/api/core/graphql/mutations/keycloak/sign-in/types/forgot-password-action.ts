export interface ForgotPasswordActionPayload {
    email: string
    keycloakUserId: string
    newPassword: string
}