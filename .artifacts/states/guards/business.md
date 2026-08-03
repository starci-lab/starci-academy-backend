# guards — the authorization contract

Source: `src/modules/bussiness/guards/` (`admin-access.guard.ts`, `graphql-admin-access.guard.ts`,
`graphql-enrollment.guard.ts`, `graphql-must-enrolled.guard.ts`, `graphql-profile-visibility.guard.ts`).
This is the shared authz layer every other domain's resolvers stack on top of the identity gate
(`KeycloakAuthGraphQLGuard` / `KeycloakOptionalAuthGraphQLGuard`, in `@modules/keycloak`, not in this
folder). For a front-end reader: this is the rulebook for "why did my request come back 401/403", not
a state machine — a guard has no state of its own, only a pass/fail decision per request.

## The five guards, what each one decides

1. **`GraphQLEnrollmentGuard`** — not an enforcer, a CONTEXT PROVIDER. Given an `x-course-id` header,
   resolves (or lazily creates, as a TRIAL row) the caller's enrollment and stamps
   `req.enrollment` / `req.enrollmentId`. Always returns `true`. Course-scoped handlers key their
   progress writes by `enrollmentId`, not `userId`, because of this guard. No header → no-op (some
   handlers self-resolve their own enrollment from the entity's own course).

2. **`GraphQLMustEnrolledGuard`** — the PAID-only gate. Requires `x-course-id`; throws
   `CourseIdRequiredException` if absent, `EnrollmentNotFoundException` if the caller's enrollment for
   that course is not `is_enrolled = true` (a TRIAL placeholder does not pass). This is the guard
   behind capstone / milestone / personal-project / premium surfaces.

3. **`GraphQLProfileVisibilityGuard`** — per-VIEWER visibility on another user's profile sub-queries
   (achievements, courses, activity feed, contribution calendar, weekly stats, coding progress, and
   friends). Reads a target `userId` off the GraphQL args (top-level or nested under `request`); a
   no-op if no id is present. The profile OWNER always passes. Anyone else is checked against
   `UserService.isProfileLocked` — locked ⇒ `ProfileNotVisibleException`. Must run AFTER an auth guard
   that populates `req.user` (so the owner check has something to compare against) — in this tree,
   always paired with `KeycloakOptionalAuthGraphQLGuard`, never alone.

4. **`GraphQLAdminAccessGuard`** / **`AdminAccessGuard`** — operator-only gate, GraphQL and REST
   twins of the same check: the `x-admin-api-key` header must match
   `MountStorageService.adminApiKey` (a Terraform-mounted secret, not an env var). Fails CLOSED — an
   unconfigured/empty mounted key throws `AdminApiKeyNotConfiguredException` rather than accepting
   any header; a missing header is `AdminApiKeyRequiredException` (401-shaped); a wrong key is
   `InvalidAdminApiKeyException` (403-shaped).

## What a front-end reader needs to know

- A 403 on a course-scoped mutation/query usually means `GraphQLMustEnrolledGuard` fired — the fix on
  the FE side is "the user needs a PAID enrollment for `x-course-id`", not "retry the request".
  `GraphQLEnrollmentGuard` never produces a 403 by itself — it silently proceeds.
  This means a screen that reads `req.enrollmentId` cannot assume the course was paid for; that is a
  SEPARATE fact the paid-only endpoints check for themselves.
- A locked profile is invisible to everyone but its owner, at the level of every individual sub-query
  — a client that fetched the top-level `userProfile` (unguarded, name+avatar only) cannot assume the
  achievements/courses/etc. sub-queries for that same user will also succeed.
- The admin guards are for internal operator tooling only (`x-admin-api-key`); nothing user-facing
  should ever see `AdminApiKeyRequiredException` in normal use.
