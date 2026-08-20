# Flow · Sign in

> ID: `sign-in` · Trigger: A learner opens the authentication route and submits credentials.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `authentication-center` | Open the localized authentication route | The centred authentication panel is displayed |
| 2 | `learner` | `authentication-center` | Submit username and password | The server verifies credentials under captcha and strict throttling |
| 3 | `identity-service` | `authentication-center` | Return an OTP challenge or the explicitly enabled local-test session path | The learner receives a challenge handle or an established session |

## Outcomes

- A valid learner receives an authenticated application session
- An ordinary production sign-in continues through an OTP challenge

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`
