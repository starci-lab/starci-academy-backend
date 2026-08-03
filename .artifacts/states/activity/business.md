# Activity — the home-feed ledger (state machine)

Source: `src/modules/bussiness/activity/**` (entity/enum from `@modules/databases`), plus the
GraphQL surfaces that read the `activities` table directly:
`src/features/api/core/graphql/queries/dashboard/my-feed/**` (the score-ranked home feed) and
`src/features/api/core/graphql/queries/users/user-feed/**` (a single user's public activity
timeline). Written for a front-end reader who never opens the backend.

## What an activity is

`ActivityEntity` (`activities` table) is an **append-only ledger of one row per trend-worthy learner
event** — read a lesson for the first time, bookmark a lesson, pass a challenge/coding
problem/milestone/AI-Lab eval, enroll in a course, post a discussion comment, follow another user
(`ActivityType`, 9 kinds). It is deliberately narrow: "auth/payment/settings/sync plumbing is
deliberately excluded" (its own JSDoc) — only things worth showing on a social/achievement feed get a
row.

Each row carries:
- `user` (the actor — who did it, `ManyToOne` → `UserEntity`, cascade-deleted with the user).
- `type` (`ActivityType`).
- `idempotencyKey` — a "scalar dedup key: a natural row id, or a synthesized `dedupeKey(...)`" — NOT
  parsed, only compared. Combined with `type` it is `@Unique`.
- `payload` (`ActivityMetadata | null`) — a denormalised snapshot (`{ target?: { entityName, id,
  label } }`) so the feed can render "X did Y to Z" and a clickable token WITHOUT joining the target
  table; the target's real route is resolved lazily by a route index (`resolveRoute(globalId)`), so
  only identity + label are stored, never a URL.

## States and transitions

There is exactly **one transition**: a row does not exist → a row exists. There is no update, no
soft-delete, no status field — `activities` is a pure append-only ledger (mirrors `xp_histories`).
The only "write" primitive is `writeActivity()`
(`src/modules/bussiness/activity/write-activity.ts`):

```
no row for (type, idempotencyKey)  ──writeActivity()──▶  row exists, forever
row already exists for (type, idempotencyKey)  ──writeActivity()──▶  no-op (same row, untouched)
```

`writeActivity` is called from 8 sites across the app — none of them import `ActivityEntity`
directly to write it (`writeActivity` is the ONLY place that ever calls
`entityManager.save(ActivityEntity, ...)` in the whole tree):

| Caller | `type` | `idempotencyKey` |
|---|---|---|
| `mutations/follows/set-follow` | `UserFollowed` | `` `${followerId}:${followingId}` `` (synthesized — a follow edge has no single row id of its own) |
| `mutations/contents/toggle-favourite` | `LessonBookmarked` | the `UserContentEntity` row id (stable across re-toggle, since favourite is a boolean flip on one persistent row, not a delete+recreate) |
| `mutations/contents/mark-as-readed` | `LessonRead` | the `UserContentEntity` row id; only fires on a DELIBERATE mark-as-read (`readed && !silent` — the passive auto-mark-on-scroll path never claims the feed row) |
| `mutations/discussion/create-comment` | `DiscussionCommented` | the new comment's own id (trivially unique — every comment is a new row) |
| `processors/enroll` (enroll job step) | `CourseEnrolled` | — |
| `processors/ai/review-milestone-task` (complete step) | `MilestonePassed` | — |
| `processors/ai/process-git-submission` / `process-google-docs-submission` (complete step) | `ChallengePassed` | — |
| `processors/ai/review-ai-lab-eval` (complete step) | `AiLabPassed` | — |
| `processors/judge-coding-submission` (judge step) | `CodingSolved` | — |

## Invariants

1. **Idempotent by `(type, idempotencyKey)`, enforced by a real unique constraint, not just an
   application check.** `writeActivity` first `findOne`s on `(type, idempotencyKey)` and returns
   early if found — but the `@Unique(["type", "idempotencyKey"])` on the entity is the hard backstop
   against a race (two concurrent callers both missing the `findOne`), matching the documented
   pattern for `xp_histories`.
2. **Written in the caller's own transaction, never its own.** `writeActivity` takes an
   `entityManager` parameter and never opens a transaction itself — every real caller passes the SAME
   manager used for the row that triggered the activity (the follow edge, the `UserContentEntity`
   upsert, the comment), so the activity row commits or rolls back atomically WITH the effect it is
   recording. A caller that saves its own effect and then calls `writeActivity` with a fresh,
   unrelated entity manager would silently break this invariant (not observed in the current 8
   callers).
3. **`payload` is a snapshot, not a live reference.** The feed never joins to the target table at read
   time for the display text/id; `label` is a point-in-time copy (e.g. a lesson's title when it was
   read). If the target is later renamed, old feed rows keep showing the old label unless a separate
   backfill re-snapshots them (not part of this domain).
4. **No row is ever mutated or deleted by application code.** Every consumer (`my-feed`, `user-feed`)
   only ever `SELECT`s from `activities`; nothing in `src/` issues an `UPDATE` or `DELETE` against it.

## The two client-facing reads

Both are raw parameterised SQL against `activities` (not the entity/query-builder), joined to
`users` and correlated against `activity_reactions` for a reaction count + the viewer's own reaction:

- **`myFeed`** (`MyFeedResolver`) — the score-ranked home feed. `tab: forYou | following` picks the
  source set (platform-wide excluding the viewer, vs. the viewer's followed-users' activity); an
  optional `category` chip (`courses | achievements | people | all`) maps to a fixed subset of
  `ActivityType`s (`CATEGORY_TYPE_MAP`). Ranking is `weight(type) × 0.5^(ageHours / 48h)` — a
  per-type relevance weight (achievements like `MilestonePassed`/`AiLabPassed` = 100, down to
  `UserFollowed` = 12) decayed with a 48-hour half-life, so a fresh low-signal event can still
  temporarily outrank a week-old achievement. Cursor-paginated with a PINNED `asOf` timestamp
  (captured on page 1) so the ranking stays stable while the viewer pages — later pages reuse the
  same decay reference and just advance an `offset`.
- **`userFeed`** (`UserFeedResolver`) — one user's own timeline (the profile "Activity" tab), newest
  -first (`created_at DESC`), no scoring. Optional auth: an anonymous viewer may read any user's
  PUBLIC timeline, gated by `GraphQLProfileVisibilityGuard` (not part of this domain's files).

Both resolvers batch-resolve `payload.target` into a real, clickable global id + label via
`LabelResolverService`, falling back to the denormalised snapshot's own `label` when the target can no
longer be resolved (e.g. deleted).
