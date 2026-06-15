# Course Completion Certificate — Plan (deferred build)

Status: **PLAN ONLY** (per thầy 2026-06-15 — build later). Captures the design so it
can be picked up without re-deciding.

## Goal
Issue a verifiable "course completed" certificate, surfaced on the public profile
(a Certificates tab / pinned) and shareable — the credential layer of the
"verified-skill profile for hiring" positioning.

## 1. What "completed" means (the missing concept)
There is no completion record today; progress is inferred from the CQRS progress
projection (`UserCourseProgressProjectionEntity`: contentCompleted/Total,
challengeCompleted/Total, milestone completed/total). Define completion as a
configurable rule per course, defaulting to:

- `contentCompleted >= contentTotal` AND `challengeCompleted >= challengeTotal`
  AND `completed >= total` (milestone tasks) — i.e. 100% of all three, OR
- a per-course `completionThreshold` (e.g. ≥ 80% weighted) read from the course
  config (add `completionRulePercent` to the course mount config / CourseEntity).

Recommendation: start STRICT (100% of content + challenges + milestones) so a
certificate genuinely means "finished the course". Loosen later via config.

## 2. Data model
New entity `CourseCertificateEntity` (`course_certificates`):
- `id` uuid, `userId`, `courseId` (unique pair), `serial` (short public code, e.g.
  `SC-<base32>` for the verify URL), `issuedAt`, `snapshotPercent` (completion % at
  issue), `revoked` boolean (refund / integrity).
- Append-only + idempotent on `(userId, courseId)`.

## 3. Issuance (event-driven, not on-read)
Hook into the existing progress projection recompute / the XP-granting events
(challenge pass / lesson read / milestone pass listeners). After a recompute that
flips a `(user, course)` to "completed", upsert a certificate (idempotent) and
emit `EventName.CertificateIssued` → NotificationService.createNotification +
ActivityEntity (`CourseCompleted` activity type → shows in the feed). Never issue
inline on a profile read.

## 4. Queries (mirror the public-profile pattern)
- `userCertificates(userId)` — public (optional-auth), `GraphQLProfileVisibilityGuard`
  (hidden on locked profiles). Returns `[{ courseGlobalId, courseTitle, serial,
  issuedAt }]` via a join `course_certificates → courses`. Reuse a token/globalId
  like the other tabs.
- `verifyCertificate(serial)` — PUBLIC, no auth: returns `{ valid, userDisplayName,
  courseTitle, issuedAt, revoked }` for the share/verify landing page (LinkedIn-style
  "see credential"). The serial is the only input — no user enumeration.

## 5. Frontend
- Profile: a "Certificates" pinned card / tab (`ProfileCertificates`) — reuse the
  per-userId → entity-id resolution (`useProfileUsername` + userProfile) like the
  other tabs. Each cert links to `/[locale]/certificates/[serial]`.
- Verify page `/[locale]/certificates/[serial]` (server component, like the profile
  OG page) → `verifyCertificate` + `generateMetadata` (OG card so a shared
  credential unfurls). Show a printable certificate layout (name, course, date,
  serial, QR to the verify URL — `QRCode` reuseable already exists).
- "Download / Share certificate" = opt-in (matches the share-is-optional rule).

## 6. Edge cases
- Refund / unenroll → set `revoked = true` (don't delete — the serial may be shared).
- Re-completion after revoke → un-revoke same row (keep serial stable).
- Course content changes after issue → `snapshotPercent` + `issuedAt` record the
  state at issue; do not retroactively revoke.

## 7. Phasing
- P0: entity + issuance listener + `userCertificates` + profile Certificates card.
- P1: `verifyCertificate` + public verify page + OG + QR.
- P2: printable/PDF export, per-course `completionRulePercent` config.

Related: [[public-profile-github-style]] (tabs pattern), the CQRS progress projection,
NotificationService, ActivityEntity feed.
