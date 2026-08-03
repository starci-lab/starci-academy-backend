# Device — findings

Graded against `.claude/canon/be/INDEX.md` and its `enforce/authoring/*` shelves. Ranked most severe
first. This is the smallest of the three domains and carries the single most severe defect found in
this pass.

## business-logic (critical — likely a live production crash)

1. **`src/modules/bussiness/device/device.service.ts:52-58`** — `recordDevice` queries
   `entityManager.findOne(DeviceEntity, { where: { userId, fingerprint } })`. `DeviceEntity.userId`
   (`src/modules/databases/postgresql/primary/entities/device.entity.ts:43-46`) is a `@RelationId`
   column — a VIRTUAL, populate-after-load field, not a real queryable column (the real column is
   `user_id` behind the `user` relation). TypeORM throws
   `EntityPropertyNotFoundError: Property "userId" was not found in "DeviceEntity"` when a `@RelationId`
   field is used inside a `where` (the exact same class of bug previously found and fixed in
   `myCourseOutline` / `contents.handler` / `pin-course-project.resolver` on 2026-06-17, per this
   codebase's own prior incident). The fix pattern already used elsewhere in this tree is
   `where: { user: { id: userId }, fingerprint }`.
   **Blast radius**: the ONLY call site is `CodingSubmissionService.submit()`
   (`src/modules/bussiness/coding/coding-submission.service.ts:118-123`), invoked unconditionally
   (no try/catch) whenever the client sends the `x-device-fingerprint` header — which is the normal
   case for any real browser client (`src/modules/client-context/decorators/client-context.decorators.ts:70`).
   The submission row is already saved (`coding-submission.service.ts:92-116`) BEFORE this call, and the
   judging-job enqueue (`coding-submission.service.ts:125-128`) happens AFTER it — so the practical
   effect is: every `submitCodingSolution` mutation from a real client throws, the caller gets an error,
   but a stray `pending`-verdict `CodingSubmissionEntity` row is left behind that is never judged
   (no job was enqueued) and never surfaced to the user again. No e2e test exercises this mutation
   against a real Postgres schema (`apps/core/test/app/` has no `submitCodingSolution` spec) and the
   only unit test for `DeviceService` (`device.service.spec.ts:82-90`) asserts the exact broken
   `where: { userId, fingerprint }` call against a MOCKED entity manager, so it passes while encoding
   the same bug as an assertion — the mock can never catch a real-schema property-name mismatch.

## naming (structure)

2. **`src/modules/bussiness/device/` has no `<domain>.module.ts`** — every sibling capability under
   `src/modules/bussiness/*` (achievements, coding, anti-cheat is the one other exception — see its own
   findings — user, streak, etc.) wraps its providers in a real `@Module`, per
   [[naming-and-structure]] §1/§6. `device/` is a bare `device.service.ts` + `types/` + `index.ts`
   barrel; `DeviceService` is registered as a raw provider directly inside the ONE consumer module
   (`coding.module.ts:20,35,42`) rather than through its own module. It is also NOT re-exported from
   the capability root's aggregator (`src/modules/bussiness/index.ts` lists every other business
   domain — `achievements`, `coding`, `user`, etc. — but not `device` or `anti-cheat`), so nothing
   outside `bussiness/coding` can reach `DeviceService` through the public entry point
   [[naming-and-structure]] §3 describes; a second consumer would have to deep-import
   `@modules/bussiness/device` directly or duplicate the provider registration.

## business-logic

3. **`DeviceEntity.trusted` (`device.entity.ts:78-83`) is a dead field** — defaults `false`, and
   nothing anywhere in `src/` ever sets it to `true` or reads it to gate anything. Combined with
   finding 1, and with the fact that no query anywhere reads the `devices` table at all (see
   `business.md` — "used for audit and anti-cheat correlation" is aspirational, not wired), the whole
   domain currently writes data (when it doesn't crash) that nothing downstream consumes.

## test-tier

4. **No e2e spec exercises `submitCodingSolution` against the real (Testcontainers) schema.** Per
   [[testing]] §2, this is exactly the class of bug — "a query that is syntactically valid but wrong
   against the real schema" — a mocked unit test structurally cannot catch, and the gap is why finding
   1 shipped and stayed unnoticed.
