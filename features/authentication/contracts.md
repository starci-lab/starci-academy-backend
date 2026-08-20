# Contracts · Account authentication

## Entity · Authentication payload (`auth-payload`)

Fields: `accessToken`, `requiresTwoFactor`, `twoFactorToken`

Evidence: `EV-007`

## Entity · Email OTP challenge (`otp-challenge`)

Fields: `challengeId`, `expiresInSeconds`, `otp`

Evidence: `EV-006`

## Operation · signIn

- Kind/owner: `mutation` / `backend`
- Inputs: email, password
- Outputs: AuthPayload, refresh cookie when usable
- Failures: invalid credentials, two-factor challenge instead of session
- Evidence: `EV-002`, `EV-005`

## Operation · signUpInit

- Kind/owner: `mutation` / `backend`
- Inputs: email, password
- Outputs: OtpChallenge
- Failures: email already used, request refused
- Evidence: `EV-002`, `EV-006`

## Operation · signUpVerifyOtp

- Kind/owner: `mutation` / `backend`
- Inputs: challengeId, otp
- Outputs: AuthPayload
- Failures: invalid or expired code
- Evidence: `EV-002`, `EV-006`

## Operation · forgotPasswordInit

- Kind/owner: `mutation` / `backend`
- Inputs: email
- Outputs: OtpChallenge
- Failures: request refused
- Evidence: `EV-002`, `EV-006`

## Operation · forgotPasswordVerifyOtp

- Kind/owner: `mutation` / `backend`
- Inputs: challengeId, otp, newPassword
- Outputs: password changed boolean
- Failures: invalid or expired code
- Evidence: `EV-002`, `EV-006`

No field, failure or operation may appear here without routed source evidence.
