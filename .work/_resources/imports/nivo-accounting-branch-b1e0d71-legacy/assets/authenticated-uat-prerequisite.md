# Historical authenticated Accounting UAT prerequisite

## Source observation

Commit `59c32fef97efa034ea7a3f9b02af8ccaa8e5f29d` added one Accounting UAT prerequisite to `TODO.md` on branch `session/20260905-nivo-accounting-01a07247`.

The note says the authenticated Accounting browser/API journey still required both:

- an approved UAT credential under existing sealed custody; and
- a lawful Accounting installation seed.

Neither item was available to that historical run. No credential value, token, cookie, session state, account identifier, or installation payload is retained here.

## Partial historical observations

The same note recorded a limited runtime smoke check:

- the real frontend locale entry responded successfully;
- a basic GraphQL type-name query responded successfully;
- eleven Accounting operations were exposed;
- an unauthenticated Accounting initialization attempt was rejected.

It also recorded that the rejection surfaced as a generic internal GraphQL error. A stable authentication-specific error code was still required before any error-code assertion could be treated as UAT-complete.

## Authority limit

These are historical claims copied as sanitized context from the source commit, not a new test run. They do not prove an authenticated journey, served-build identity, approved credential, lawful fixture, current API behavior, or current UAT completion. This asset must not promote any Accounting or login node.
