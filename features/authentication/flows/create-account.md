# Flow · Create an account

> ID: `create-account` · Trigger: A visitor switches the authentication surface to Create one.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `visitor` | `authentication-screen` | Submit email and a new password | An emailed OTP challenge starts |
| 2 | `visitor` | `authentication-screen` | Submit the six-digit code | The account is created and the returned session is adopted |

## Outcomes

- The account is created and signed in
- A refused or expired code stays visible without inventing success

Evidence: `EV-001`, `EV-002`, `EV-006`
