# Device — business map

Source read: `src/modules/bussiness/device/**` (no `.module.ts` — see findings), and every call site
(`src/modules/bussiness/coding/coding-submission.service.ts`). No dedicated GraphQL resolver reads or
lists device rows anywhere in `src/features/api/core/graphql/**` — this domain is write-only from the
FE's point of view; nothing in the schema exposes a user's device list back to them or to an admin.

## Entities

- **DeviceEntity** (`devices` table) — one row per `(user, fingerprint)` pair (enforced by a real unique
  constraint, `UQ_devices_user_fingerprint`). Fields: `fingerprint` (client-generated, FingerprintJS via
  the `x-device-fingerprint` header), `userAgent`, `ipAddress` (both nullable, "best effort"), `lastSeenAt`
  (bumped every sighting), and `trusted` (boolean, defaults `false`).

## States

A device row is conceptually one of:

1. **Unseen** — no row exists yet for this `(user, fingerprint)`.
2. **First sighting** — a row is created on the first call with a real fingerprint; `lastSeenAt` stamped
   to "now", `trusted = false` (its default — nothing in this codebase ever sets it to `true`; see
   invariant below).
3. **Returning** — a row already exists; `ipAddress`/`userAgent`/`lastSeenAt` are refreshed in place on
   every subsequent sighting. There is no history kept of PAST ip/user-agent values — each sighting
   overwrites the last.

There is no "blocked" or "revoked" state modeled anywhere: `trusted` exists on the entity but nothing
in the codebase reads it to gate anything, and nothing ever flips it away from its `false` default.

## Transitions

- **A coding submission with a fingerprint header → `recordDevice()` runs as a best-effort side effect**
  of `CodingSubmissionService.submit()`, AFTER the submission row is already persisted and BEFORE the
  judging job is enqueued. This is the domain's only call site.
- **No fingerprint supplied → no-op.** `recordDevice` returns immediately without touching the database
  when the client sent no fingerprint (old client, or one that opted out).

## Invariants (as documented in code, and as actually true)

- **Documented invariant**: "used for audit and anti-cheat correlation (e.g. many accounts sharing one
  device, or one account spread across many)" (`device.service.ts:16-23`).
- **Actual invariant, contradicting the above**: nothing in the codebase ever QUERIES the `devices` table
  for cross-account correlation. No resolver, no admin query, no anti-cheat check reads `DeviceEntity`
  at all outside of `DeviceService` itself. The table is currently written to and never read from — see
  `findings.md` for the severity of this gap, compounded by a second defect that means it likely is not
  even being written to correctly.

## What a FE reader needs to know

Nothing today — there is no GraphQL surface for this domain. A future "your devices" security-settings
screen, or an admin "accounts sharing a device" view, would be new work, not a wiring fix, since the
query side does not exist yet at all.
