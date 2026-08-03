# Achievements — business map

Source read: `src/modules/bussiness/achievements/**`, `src/features/api/core/graphql/queries/achievements/**`,
`src/features/api/core/graphql/queries/users/user-achievements/**`, `src/features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/**`.

## Entities

- **AchievementEntity** (seeded, curated) — `slug` (stable key, pairs to a code-side `AbstractBadge`), bilingual `name`/`description`, `iconKey` (MinIO object key for badge art), `criteriaType`, `threshold` (single-tier bar, or the first tier when tiered), `tierThresholds` (nullable array — presence means the badge is tiered), `sortIndex` (display order).
- **UserAchievementEntity** (award ledger) — one row per `(user, achievement, tier)` earned; `tier` is `null` for a single-tier badge, 1-based for a tiered one; `earnedAt` timestamp. This is the source of truth for "does this user hold this badge" — nothing else is.
- **UserAchievementProjectionEntity** (CQRS read cache) — one row per user (`user_id` is the PK), `value` jsonb holding `{ data, count }` (the last computed wall), `updatedAt` used for the TTL check.
- **AbstractBadge** (code-side, not a DB row) — 13 concrete subclasses ("animals"), each owning a scalar SQL subquery (`getSql()`) that computes the user's raw metric, and `checkEligible(value, definition)` deciding which tiers are met. A badge only "counts" if its `slug` also has a seeded `AchievementEntity` row — an un-seeded badge is silently skipped (see invariant below).

## States

An achievement, for one user, is in exactly one of:

1. **Not eligible** — current metric value is below `threshold` (or below the first `tierThresholds` bar). `earned = false`, `tierReached = null`, `rarityPercent = null`.
2. **Earned, single-tier** — a `UserAchievementEntity` row exists with `tier = null`. `earned = true`, `tierReached = null`.
3. **Earned, tier N** — one or more `UserAchievementEntity` rows exist for this achievement; `tierReached` is the HIGHEST tier held. Each tier crossed inserts its own ledger row the first time it is crossed — tiers already held are never re-inserted (idempotent).

Cutting across those, the **projection cache** for the whole wall (all achievements for one user) is either:

- **Fresh** — read within `envConfig().projection.staleAfterMs` of its last write; served as-is, `newAchievements = []` always (a cache hit never "discovers" anything new).
- **Stale / missing** — recomputed from source tables + re-awarded on this read, then the fresh snapshot is written back.

## Transitions

- **Metric increases → recompute (on read only)**. Nothing pushes an award; every award happens lazily inside `getMyAchievements` (or explicitly via `recomputeForUser`, e.g. from an inline write path that wants the tier bump to land in the same transaction as the triggering change).
- **Recompute → award**: for every registered badge with a matching seeded definition, `checkEligible` names the tiers reached; each is inserted idempotently (`INSERT ... WHERE NOT EXISTS ... tier IS NOT DISTINCT FROM $3`, backstopped by a real unique constraint against a concurrent duplicate insert). A tier once earned is never un-earned — there is no downgrade path in this codebase (a metric that later drops does not remove the ledger row).
- **Any of 10 source tables changes (CDC) → projection invalidated (hard delete), not recomputed eagerly.** `AchievementProjectionListener` listens on `user_contents`, `xp_histories`, `user_challenge_submission_attempts`, `user_milestone_task_attempts`, `enrollments`, `content_comments`, `user_follows`, `coding_submissions`, `ai_lab_eval_runs`, `user_leagues`. A `user_follows` row moves the **followed** user's wall (busy-bee counts followers), every other table moves the **acting** user's wall. The TTL (`isStale`) is the lazy fallback if a CDC event is ever missed.
- **Read after invalidation/miss/stale → recompute + award + re-cache.** This is the only path that can produce `newAchievements` (the subset whose first award was inserted THIS read) — used by the FE to pop a congratulations modal. A cache hit can never populate `newAchievements`.

## Invariants

- **Award idempotency**: a `(user, achievement, tier)` triple is awarded at most once; `earnedAt` is captured on first crossing and never touched again (`indexEarned` keeps the EARLIEST `earnedAt` across duplicate ledger rows, and the HIGHEST `tier`).
- **Badge/definition pairing by slug, not by array position**: a badge whose `slug` has no matching seeded `AchievementEntity` is silently skipped in both `award()` and the presentation map — it contributes no value, no award, and never appears in `myAchievements`. Adding a new `*.badge.ts` class with no matching DB seed row is a silent no-op, not an error.
- **Rarity is only meaningful once earned**: `rarityPercent` is `null` for an achievement the viewer hasn't earned (so the bar itself is never leaked as a rarity number), and is floored at 1% even for a badge held by everyone (so a held badge never displays "Top 0%").
- **`myAchievements` (viewer) vs `userAchievements` (public profile) share one code path** (`getMyAchievements(userId)`), scoped only by which `userId` is passed in — the viewer's own id (from the auth token) for the former, an arbitrary `userId` GraphQL arg for the latter, gated by `GraphQLProfileVisibilityGuard` (owner or unlocked profile only).
- **Three badges (architect-rhino, fullstack-monkey, devops-wolf) are hard-tied to specific course UUIDs** baked into their SQL (`m.course_id = '1ab239c8-...'` etc.) — these only measure the right thing in an environment where those three courses were seeded with exactly those ids.

## Read surfaces (for FE)

| Query | Scope | Guard | Notes |
|---|---|---|---|
| `myAchievements` | viewer's own wall | `KeycloakAuthGraphQLGuard` | Only surface that returns `newAchievements` (congrats-modal trigger). |
| `userAchievements(userId)` | any user's wall | `KeycloakOptionalAuthGraphQLGuard` + `GraphQLProfileVisibilityGuard` | No `newAchievements` in the response shape — public view only. |
| `myPickableCvAchievements` | viewer's earned achievements, for CV-builder achievement blocks | (see that handler) | Reuses the same earned-achievement data for a different presentation. |
