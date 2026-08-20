# Flow · Sign in

> ID: `sign-in` · Trigger: A visitor submits an email and password on /authentication.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `visitor` | `authentication-screen` | Enter email and password and press Sign in | The frontend sends signIn |
| 2 | `visitor` | `authentication-screen` | Receive a usable auth payload | The session is adopted and the console becomes available |

## Outcomes

- A usable session is established
- Invalid credentials are shown as a refusal
- A two-factor-enabled account remains a pending challenge rather than becoming a session

Evidence: `EV-002`, `EV-003`, `EV-005`
