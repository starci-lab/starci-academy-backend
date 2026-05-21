/**
 * Kiểu dữ liệu dùng chung cho xác thực Keycloak.
 * (EN: Shared types for Keycloak authentication.)
 */

/**
 * Response từ Keycloak token endpoint (OIDC token response).
 * (EN: Response from Keycloak token endpoint (OIDC token response).)
 */
export type TokenResponse = {
    access_token: string
    expires_in: number
    refresh_expires_in?: number
    refresh_token?: string
    token_type: string
    id_token?: string
    scope?: string
}

/**
 * Payload giải mã từ JWT access token — chỉ lấy các trường cần thiết cho lab.
 * (EN: Decoded JWT access token payload — only essential fields for the lab.)
 */
export type JwtUser = {
    sub: string
    preferred_username?: string
    email?: string
}
