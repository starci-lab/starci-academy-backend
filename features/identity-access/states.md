# States · Identity and access

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `credentials-ready` | initial | Credentials ready | verification-pending | `EV-001`, `EV-002` |
| `verification-pending` | pending | Verification pending | otp-required, session-established, authentication-error | `EV-003`, `EV-004` |
| `otp-required` | partial | OTP required | session-established, authentication-error | `EV-004` |
| `session-established` | success | Session established | terminal | `EV-002`, `EV-003` |
| `authentication-error` | error | Authentication failed | credentials-ready | `EV-003`, `EV-004` |
