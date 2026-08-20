# Contracts · Identity and access

## Entity · Sign-in request (`sign-in-request`)

Fields: `email`, `password`

Evidence: `EV-003`, `EV-004`

## Entity · OTP challenge (`otp-challenge`)

Fields: `challengeId`, `expiresInSeconds`

Evidence: `EV-004`

## Entity · Application session (`application-session`)

Fields: `accessToken`, `refreshToken cookie`, `CSRF cookie`

Evidence: `EV-003`, `EV-004`

## Operation · signInInit

- Kind/owner: `mutation` / `backend`
- Inputs: email, password
- Outputs: challengeId and expiresInSeconds, or accessToken-backed application session
- Failures: captcha rejected, strict throttle rejected, credentials rejected, OTP or mail hand-off failed
- Evidence: `EV-003`, `EV-004`

No field, failure or operation may appear here without routed source evidence.
