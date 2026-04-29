

/** Payload stored temporarily for OTP-gated actions (e.g. sign-in, sign-up). */
export interface OtpActionPayloadRecord<TPayload = unknown> {
    /** Email of the user (recipient of OTP). */
    email: string
    /** OTP hash. */
    otpHash: string
    /** Number of attempts. */
    attempts: number
    /** Action payload (stored server-side until OTP is verified). */
    payload: TPayload
}

/** Params for creating an OTP-gated action challenge. */
export interface CreateActionChallengeParams<TPayload = unknown> {
    /** Email of the user. */
    email: string
    /** Action payload stored until OTP is verified. */
    payload: TPayload
}

/** Result of creating an OTP-gated action challenge. */
export interface CreateActionChallengeResult {
    /** Challenge ID. */
    challengeId: string
    /** OTP code. */
    otp: string
    /** OTP expiration time in seconds. */
    expiresInSeconds: number
}

/** Result of refreshing the OTP for an existing challenge (same challenge id, new code, TTL reset). */
export interface RefreshActionChallengeOtpResult {
    /** New OTP (plaintext for email only). */
    otp: string
    /** OTP expiration time in seconds (full window). */
    expiresInSeconds: number
    /** Email on the challenge record. */
    email: string
}

/** Result of verifying an OTP-gated action challenge. */
export interface VerifyActionChallengeResult<TPayload = unknown> {
    /** Email of the user. */
    email?: string
    /** Payload stored during init step. */
    payload?: TPayload
    /** Whether the OTP code is incorrect. */
    mismatch: boolean
    /** Number of attempts left. */
    attemptsLeft: number
    /** Whether the challenge is not found. */
    notFound: boolean
}

/** Params for creating a login OTP challenge. */
export interface CreateLoginChallengeParams {
    /** Email of the user. */
    email: string
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

