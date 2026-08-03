# user — findings

Graded against `.claude/canon/be/enforce/authoring/{authorization,comments,naming-and-structure,testing}.md`.
Scope read: `src/modules/bussiness/user/*` plus every caller of `UserService` (guards, socket gateways,
`content-ai.service.ts`, GitHub OAuth redirect, and the installment-plan cron that flips
`is_enrolled` outside this service).

## 1. [security / business-logic] Installment-plan default/recovery flips `is_enrolled` without invalidating the enrollment cache — stale authorization for the plan's TTL

- **Anchor**: `src/modules/bussiness/installment-plan/installment-plan.service.ts:357-379` (`lockGatedEnrollments`, sets `isEnrolled: false`) and `:389-424` (`unlockGatedEnrollments`, sets `isEnrolled: true`) — neither calls `UserService.invalidateEnrolledCourses`. Driven by `installment-plan-enforcement.cron.ts:126-139` (default path) and `installment-plan.service.ts:252,281` (`recordPayment` catch-up path).
- **Rule broken**: `UserService.checkEnrollment`'s own JSDoc/contract (`src/modules/bussiness/user/user.service.ts:142-158`, `invalidateEnrolledCourses`): *"Call this AFTER any enrollment change commits (enroll / refund / unenroll) — it is the single invalidation point that keeps the authorization cache from going stale."* This is the one write path in the whole tree that changes `EnrollmentEntity.isEnrolled` on an ALREADY-enrolled user and skips it.
- **What breaks**: `checkEnrollment` is the paid-only gate (`GraphQLMustEnrolledGuard`, capstone/milestone/personal-project/premium). A learner whose `UserEnrolledCourses` set is already cached (the common case — anyone active in the last TTL window) keeps paid access to a course the cron just locked for defaulting on payment, until the cache entry expires on its own. The inverse also leaks: `unlockGatedEnrollments` (payment catch-up) can leave a user LOCKED OUT of a course they just paid to restore, because the stale cached set still lacks it. This is exactly the "freshly bought course doesn't show up / refunded one stays open" failure mode the cache's own doc warns about, just triggered from a call site the doc doesn't know about.
- Confirmed by tracing every `isEnrolled` write site in the tree (`grep -rl "isEnrolled" src`) — `enroll-step.service.ts` is the only other writer, and it DOES call `invalidateEnrolledCourses` (`enroll-step.service.ts:311`, asserted in `enroll-step.service.spec.ts:281,315`). The installment-plan writer is the one path that doesn't.

## 2. [jsdoc / naming] `getUserByKeycloakId` restates its name and hides that it returns a partial (id-only) entity typed as the full one

- **Anchor**: `src/modules/bussiness/user/user.service.ts:35-37` — `/** Get user by user ID from Keycloak */`, return type `Promise<UserEntity>`, but the DB path at `:54-64` reads `select: { id: true }` only, and the cache stores exactly that partial row under `CacheKey.KeycloakUser`.
- **Rule broken**: `comments.md` §3 (JSDoc restating the name carries no information) and the type-safety expectation that a `Promise<UserEntity>` return actually has the fields `UserEntity` promises.
- **What breaks**: every current caller (`mock-interview.gateway.ts:377`, `notifications.gateway.ts:104`, `content-ai.service.ts:928`, `redirect.handler.ts:81`, `keycloak-optional-auth-graphql.guard.ts:71`) only reads `.id`, so nothing breaks TODAY — but the return type gives a future caller no compile-time or doc-level warning before they read `.email`/`.username`/`.avatar` off `req.user` in an optional-auth resolver and silently get `undefined`. A one-line JSDoc addendum ("only `.id` is populated — this is an identity lookup, not a profile fetch") would have made the risk visible; a narrower return type (`Pick<UserEntity, "id">`) would make it compiler-visible.

## 3. [edge-case] `checkEnrollment` and `getUserByKeycloakId` share a cache-miss race with no lock — acceptable, but undocumented as such

- **Anchor**: `user.service.ts:102-140` (`checkEnrollment`) — cache miss triggers a rebuild query with no distributed lock; two concurrent requests on a cold cache both rebuild and both `cacheService.set` the same key.
- **Judgment, not a canon breach**: the rebuild is idempotent (same deterministic SQL) so a duplicate rebuild is wasted work, not a correctness bug — unlike `resolveOrCreateTrialEnrollment`, which explicitly handles its own race via the unique-constraint catch (`:193-228`) and is tested for it (`user.service.spec.ts:325-346`). `checkEnrollment`'s race is undocumented and untested (no spec asserts concurrent-miss behavior), which is a smaller gap than #1 but worth noting since the two nearby methods handle the same class of race inconsistently — one explicitly, one silently.
