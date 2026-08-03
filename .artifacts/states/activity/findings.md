# Activity — findings (ranked, most severe first)

Graded against `.claude/canon/be/enforce/authoring/{authorization,comments,naming-and-structure,
testing}.md`. Scope: `src/modules/bussiness/activity/**`, plus
`src/features/api/core/graphql/queries/dashboard/my-feed/**` and
`src/features/api/core/graphql/queries/users/user-feed/**` (the two resolvers that read the
`activities` table directly).

---

## 1. [test-tier] `writeActivity` — the sole gate on the idempotency invariant for 8 call sites — has zero unit spec

**File:** `src/modules/bussiness/activity/write-activity.ts` (whole file — no `.spec.ts` sibling
anywhere in `src/modules/bussiness/activity/`).

`writeActivity` is the ONLY function in the entire tree that ever writes an `ActivityEntity` row (verified: `entityManager.save(ActivityEntity, ...)` occurs nowhere else in `src/`), and 8 independent
call sites across 4 mutation handlers and 4 job-processor steps depend on its "already recorded →
no-op" branch to avoid duplicate feed rows (a re-read lesson, a re-follow, a re-graded attempt). Per
`testing.md` §1, this is exactly the shape unit testing exists for — "the logic, the branches, and
the exceptions thrown" of one function, no database required (the `entityManager` is a natural
jest-mock boundary: `findOne` returns a row → assert `save` is never called; `findOne` returns
`null` → assert `save` IS called with the right shape). None of that is pinned today, so a future
edit to the `findOne` predicate (e.g. someone "simplifying" the `where` clause) could silently
reintroduce duplicate feed rows with no test catching it.

---

## 2. [test-tier] The two resolvers carrying this domain's only real logic — score decay, cursor codec, category→type mapping — have zero unit or e2e coverage

**Files:** `src/features/api/core/graphql/queries/dashboard/my-feed/my-feed.resolver.ts`,
`src/features/api/core/graphql/queries/users/user-feed/user-feed.resolver.ts` — no `.spec.ts`
sibling for either, and no `*.e2e-spec.ts` anywhere under `apps/core/test/` mentions "feed" or
"activity".

`MyFeedResolver` carries three private methods worth unit testing on their own (no DB needed):
`scoreExpression()` (the weight × recency-decay SQL fragment), `encodeCursor`/`decodeCursor` (base64url
codec with explicit malformed-input handling — `decodeCursor` at
`my-feed.resolver.ts:245-267` deliberately swallows `JSON.parse` failures and out-of-range `offset`
back to "page 1", logic that is exactly the kind of edge case a unit test exists to lock down).
`UserFeedResolver` has the equivalent pair. Neither is tested, and the shared score-ranking formula
(`ACTIVITY_TYPE_WEIGHT`, `FEED_SCORE_HALF_LIFE_HOURS` in `my-feed/constants/index.ts`) that decides
what a learner sees first on their home feed has no test asserting the ranking actually orders the
way the constants intend.

---

## 3. [business-logic / edge-case] `myFeed` and `userFeed` hand-write two near-duplicate raw SQL blocks against `activities`/`users`/`activity_reactions`, bypassing the entity layer

**Files:** `my-feed.resolver.ts:125-145` and `user-feed.resolver.ts:102-124`.

Both resolvers issue `entityManager.query<Array<...>>(...)` with a hand-written SQL string selecting
the same 9 columns (`a.id`, `a.user_id AS "actorUserId"`, `u.username`, `u.avatar`, `a.type`,
`a.payload AS "metadata"`, `a.created_at AS "at"`, a `activity_reactions` COUNT subquery, and a
per-viewer reaction subquery) from `activities a JOIN users u`, differing only in their `WHERE`/`ORDER
BY` clause. Because this bypasses `ActivityEntity`/the query builder, a column rename on the entity
(e.g. `payload` → something else, following a schema change) or on `activity_reactions` would not be
caught by the compiler in either file — only a runtime SQL error, and only if the moved column happens
to be exercised by a test (see finding #2: neither resolver has one). This is filed as a judgement call
under business-logic/edge-case rather than a named canon violation — raw SQL is an accepted pattern
elsewhere in this codebase for scoring queries the ORM cannot express — but the ~90% duplication
between the two blocks is real drift risk: a fix applied to one (e.g. adding a new reaction type to
the subquery) is easy to apply to only one of the two feeds and forget the other.

---

## 4. [naming] `writeActivity`'s own JSDoc calls the dedup field `refId`; the actual field is `idempotencyKey`

**Files:** `src/modules/bussiness/activity/write-activity.ts:29` ("Guards on the `(type, refId)`
unique key...") — the real column/param, matching `ActivityEntity`'s
`@Unique(["type", "idempotencyKey"])` (`activity.entity.ts:51-52`), is `idempotencyKey`, not `refId`.
The same shorthand is echoed in two call-site comments
(`mark-as-readed.handler.ts:141`: "writeActivity are idempotent on the user-content refId";
`toggle-favourite.handler.ts:113`: "refId is the user-content id so re-bookmarking never
duplicates") — so this reads as an established-but-wrong shorthand carried across 3 files rather than
a one-off typo. Per `comments.md` §5 ("a comment LIVES with its code... changing behaviour while the
comment still describes the old behaviour means the diff is NOT finished"), a fresh reader who greps
the file for `refId` to understand the dedup key will not find the field that actually enforces it.
Low severity (no behavioral impact — the code itself is correct), but a real, fixable naming drift
across all 3 sites.
