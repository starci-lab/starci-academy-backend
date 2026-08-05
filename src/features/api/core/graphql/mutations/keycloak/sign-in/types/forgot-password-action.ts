/**
 * Stashed on the OTP challenge so verify can apply the new password without
 * the client re-sending it (and so a leaked OTP alone is not enough without
 * this server-held payload).
 */
export interface ForgotPasswordActionPayload {
    email: string
    keycloakUserId: string
    newPassword: string
}