/**
 * Keycloak token response stored for OTP verification.
 */
export interface OtpLoginChallengeTokenResponse {
    /** Keycloak access token. */
    access_token: string
    /** Keycloak refresh token. */
    refresh_token: string
    /** Keycloak token type. */
    token_type: string
    /** Keycloak ID token. */
    id_token?: string
}

/** Params for creating a login OTP challenge. */
export interface CreateLoginChallengeParams {
    /** Email of the user. */
    email: string
    /** Keycloak tokens obtained from Keycloak (kept server-side until OTP is verified). */
    tokenResponse: OtpLoginChallengeTokenResponse
}

/** Result of creating a login OTP challenge. */
export interface CreateLoginChallengeResult {
    /** Challenge ID. */
    challengeId: string
    /** OTP code. */
    otp: string
    /** OTP expiration time in seconds. */
    expiresInSeconds: number
}

/** Params for verifying a login OTP challenge. */
export interface VerifyLoginChallengeParams {
    /** Challenge ID. */
    challengeId: string
    /** OTP code. */
    otp: string
}

/** Tokens returned after successful OTP verification. */
export interface LoginChallengeTokens {
    /** Keycloak access token. */
    accessToken: string
    /** Keycloak refresh token. */
    refreshToken: string
    /** Keycloak token type. */
    tokenType: string
    /** Keycloak ID token. */
    idToken?: string
}

/** Stored token bundle inside the redis record. */
export interface LoginChallengeTokenBundle {
    /** Keycloak access token. */
    accessToken: string
    /** Keycloak refresh token. */
    refreshToken: string
    /** Keycloak token type. */
    tokenType: string
    /** Keycloak ID token. */
    idToken?: string
}

/** Redis record for a login OTP challenge. */
export interface LoginChallengeRecord {
    /** Email of the user. */
    email: string
    /** OTP hash. */
    otpHash: string
    /** Number of attempts. */
    attempts: number
    /** Keycloak tokens. */
    tokens: LoginChallengeTokenBundle
}

/** Result of verifying a login OTP challenge. */
export interface VerifyLoginChallengeResult {
    /** Email of the user. */
    email?: string
    /** Keycloak tokens. */
    tokens?: LoginChallengeTokens
    /** Whether the OTP code is incorrect. */
    mismatch: boolean
    /** Number of attempts left. */
    attemptsLeft: number
    /** Whether the challenge is not found. */
    notFound: boolean
}

