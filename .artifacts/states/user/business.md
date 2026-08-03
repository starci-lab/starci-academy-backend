# user — states, transitions, invariants

Source: `src/modules/bussiness/user/` (`user.service.ts`, `types/`). Consumed by the identity
guards (`guards` domain) and by every resolver that reads `@KeycloakGraphQLUser()`.

`UserEntity` itself (fields, columns) lives in `@modules/databases` and is not re-described here —
this file is the **behavior** `UserService` wraps around the row: identity resolution, enrollment
membership, and profile-lock visibility. All three are read-heavy, cache-backed checks used on
authorization hot paths, not CRUD.

## 1. Identity: Keycloak subject → app user row

- **State**: a user row exists (or does not) for a given Keycloak `sub`.
- **Read path** — `getUserByKeycloakId(keycloakId)`: cache (`CacheKey.KeycloakUser`) → on miss, a
  DB read `SELECT ... WHERE keycloakId = $1` that is **deliberately narrowed to `select: { id: true }`**
  — the row cached and returned only ever carries `.id`, nothing else (no email, username, avatar).
  Every real caller in the tree (the socket gateways, the GitHub OAuth redirect, `ContentAiService`,
  the optional-auth GraphQL guard) reads only `.id` off the result — the partial shape is safe today
  because nothing depends on the other fields, not because the type says so (`Promise<UserEntity>`
  promises the full row).
- **Miss with no row** → `UserNotFoundException`. There is no "create on optional-auth read" path —
  creation only happens in the separate `AbstractKeycloakAuthGuard` (required-auth path, a different,
  uncached `findOne` with no `select` restriction that creates the row on first sign-in). So the FULL
  user row a resolver ultimately sees on `req.user` depends on WHICH guard ran: the required-auth path
  populates every column; the optional-auth path (`KeycloakOptionalAuthGraphQLGuard`, via
  `getUserByKeycloakId`) populates `.id` only.

## 2. Enrollment: none → TRIAL → PAID

Enrollment is not a boolean on the user — it is `EnrollmentEntity`, one row per (user, course), with
`is_enrolled` as the real state flag the whole authorization layer keys off:

- **No row** — the user has never touched the course.
- **TRIAL** (`is_enrolled = false`) — created lazily by `resolveOrCreateTrialEnrollment` the first
  time a course-scoped request carries an `x-course-id` header (via `GraphQLEnrollmentGuard`, see the
  `guards` domain). A trial row unlocks course-scoped, per-enrollment progress tracking but NOT any
  paid-only surface.
- **PAID** (`is_enrolled = true`) — set by the enrollment/purchase flow (outside this domain).
  `checkEnrollment(userId, courseId)` is the ONLY gate paid-only surfaces (capstone, milestone,
  personal-project, premium) trust, and it is scoped `WHERE ... AND is_enrolled = true` — a trial row
  never satisfies it.
- **Transition TRIAL → PAID** happens elsewhere (the purchase/enrollment module); this domain only
  reads the flag and invalidates its cache after the transition.

**Invariant**: a trial placeholder must never satisfy `checkEnrollment`. **Invariant**: the enrolled-
course-id cache (one Redis set per user, `CacheKey.UserEnrolledCourses`) is the single source
`checkEnrollment` trusts on a hit — it MUST be dropped (`invalidateEnrolledCourses`) synchronously
after any row's `is_enrolled` changes, or a freshly-purchased course silently stays locked (or a
refunded one silently stays open) for the cache's TTL.

**Race handling**: `resolveOrCreateTrialEnrollment` is idempotent under the `(user, course)` unique
constraint — a concurrent double-create is caught and the loser re-reads the winner's row rather than
throwing.

## 3. Profile visibility: locked ↔ unlocked

- **State**: `UserEntity.profileLocked` (Facebook-style "lock profile").
- `isProfileLocked(userId)` is the same shape as `checkEnrollment` — one cached boolean
  (`CacheKey.UserProfileLocked`) per user, rebuilt from a single-PK read on miss, dropped
  (`invalidateProfileLocked`) after any profile update.
- **Invariant**: the owner always sees their own profile regardless of the lock (enforced in
  `GraphqlProfileVisibilityGuard`, not here); a locked profile's sub-queries (achievements, courses,
  activity feed, coding progress, etc.) throw `ProfileNotVisibleException` for anyone else. The public
  `userProfile` header query (name/avatar) is deliberately NOT gated by this flag.

## What a front-end screen can rely on

- "Is this course unlocked for me" is answered by `is_enrolled = true` on the user's own enrollment
  row — never infer it from a trial row's mere existence.
- "Is this profile visible to me" is a per-viewer answer, not a static property of the profile: the
  owner always passes; everyone else is subject to the lock flag at read time.
- A user id populated on `req.user` after an OPTIONAL-auth resolver may carry `.id` alone — a
  front-end contract that assumes a signed-in optional-auth query returns `username`/`avatar` off the
  viewer object is assuming a shape this layer does not guarantee.
