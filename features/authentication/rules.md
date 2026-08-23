# Business rules · Account authentication

## BR-01

Sign in, account creation, and password reset are modes of the same /authentication surface, not separate routes.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-02

A two-factor challenge is not a usable session: accessToken is null until verifyTwoFactor succeeds, while the refresh token remains in an HttpOnly cookie.

- Strength: `confirmed`
- Evidence: `EV-003`, `EV-005`, `EV-007`

## BR-03

Completing password reset changes the password and returns a boolean; it does not sign the visitor in.

- Strength: `confirmed`
- Evidence: `EV-002`
