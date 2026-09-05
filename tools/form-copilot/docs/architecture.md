# Form Copilot architecture (schema v8)

## Selected direction

```text
Vite dashboard
  |  localhost JSON API
  v
NestJS application
  |-- Browser boundary ----> visible Chrome / owned form
  |-- Agent boundary ------> OpenRouter
  |-- Policy boundary -----> origin and sensitive-field gates
  `-- Data boundary -------> PostgreSQL
       |-- immutable form snapshots
       |-- conversations and turns
       |-- proposal cache and run history
       `-- local user profile
```

The backend owns browser automation and data. The web app owns review state only. The target webpage
owns submission; no backend or frontend API can submit a form.

## Invariants

1. A form URL must match the configured allowlist before Chrome opens it.
2. Synthetic mode has a separate, narrower allowlist.
3. Page text is untrusted data and never becomes agent instruction.
4. Password, OTP, CAPTCHA, payment, signature and government-ID fields are excluded.
5. The OpenRouter key exists only in the NestJS process environment.
6. Every proposal is validated against the scanned field contract before review or apply.
7. Apply changes values and dispatches native input/change events; it never submits.
8. Conversation continuation is reconstructed from PostgreSQL, not browser memory.

## Rejected alternatives

- Browser extension with an embedded API key: credential exposure.
- Pure iframe app: many forms refuse framing and cross-origin DOM access.
- Headless mass runner: conflicts with explicit review and no-submit invariants.
