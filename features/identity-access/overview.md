# Overview · Identity and access

## Purpose

Learners enter the localized authentication route, submit credentials, complete the server-selected verification path, and receive an application session before protected learning surfaces become available.

## Included

- Authentication route and centred authentication panel
- Credential sign-in initiation
- OTP challenge or explicitly enabled local-test direct session
- Session cookie, CSRF cookie and server session establishment

## Excluded

- Provider account linking and two-factor settings outside the mounted authentication journey
- Any identity behavior not exercised by the current route or cited mutation

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `84bf3be6565a20b1fee9c83cab8b9ba810d13e11` |
| be | https://github.com/starci-lab/starci-academy-backend | `0066625ed94b10bf5b6892af775e45bdd6823558` |
