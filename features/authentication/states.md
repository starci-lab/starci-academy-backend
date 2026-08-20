# States · Account authentication

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `details` | initial | Enter details | code, authenticated, two-factor, refused | `EV-002` |
| `code` | pending | Verification code requested | authenticated, done, refused | `EV-002`, `EV-006` |
| `authenticated` | success | Authenticated session | terminal | `EV-002`, `EV-005` |
| `done` | success | Password changed | details | `EV-001`, `EV-002` |
| `two-factor` | partial | Two-factor verification required | details | `EV-002`, `EV-003` |
| `refused` | error | Credentials or code refused | details, code | `EV-002`, `EV-004` |
