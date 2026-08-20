# Business rules · Identity and access

## BR-01

Credential sign-in initiation is protected by captcha and strict throttling before the mutation executes.

- Strength: `confirmed`
- Evidence: `EV-003`

## BR-02

The ordinary sign-in path verifies the password, creates an OTP challenge, queues the OTP email and returns the challenge id plus expiry.

- Strength: `confirmed`
- Evidence: `EV-004`

## BR-03

A direct local-test session is permitted only for the explicitly configured test account outside production; successful direct completion attaches refresh and CSRF cookies and starts the server session.

- Strength: `confirmed`
- Evidence: `EV-003`, `EV-004`
