# Historical authentication contract observations

The legacy design record says ordinary password sign-in gated on `twoFactorEnabled`, while the then-present OTP verification path returned `requiresTwoFactor: false`. It also records that the real-time resend-cooldown happy path had not been executed.

These are source-era risk statements, not a current contract review. The migration did not inspect credentials, run authentication, or establish whether later backend/frontend commits resolved or superseded either observation. This evidence remains inconclusive for `login-api-contract-reviewed` and changes no node state.
