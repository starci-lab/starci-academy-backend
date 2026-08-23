# Flow · Reset a password

> ID: `reset-password` · Trigger: A visitor chooses Forgot your password?.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `visitor` | `authentication-screen` | Submit the account email | A generic emailed OTP challenge starts |
| 2 | `visitor` | `authentication-screen` | Submit the code and new password | The password is changed but no session is created |

## Outcomes

- The visitor is returned to sign in with the new password
- The surface does not reveal whether the submitted email owns an account

Evidence: `EV-001`, `EV-002`, `EV-006`
