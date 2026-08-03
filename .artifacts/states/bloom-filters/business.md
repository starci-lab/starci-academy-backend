# Bloom Filters — business map

Bloom Filters is not a learner-facing feature — it is a **fast-path dedup pre-check** sitting in front
of the real source of truth (Postgres' email-uniqueness constraint). There is exactly one instance
today: `EmailBloomFilterService`, a probabilistic "have we possibly seen this email before" cache used
by the sign-up flows so a near-certain duplicate can be rejected (or at least suspected) before ever
touching the database.

## The one entity: a single, shared, ephemeral filter

There is no Postgres table. The whole state is **one Redis-cached object** — a `ScalableBloomFilter`
(from the `bloom-filters` npm package) — stored under a single cache key
(`CacheKey.BloomFilter` + `args: [BloomFilterType.Email]`). There is exactly one filter instance for
the whole platform (not per-user, not per-course): every learner's email lands in the same structure.

## States and transitions

```
absent (never seeded, or evicted from Redis)
   │  loadOrCreate() on the next add()/addMultiple() call
   ▼
present, empty
   │  add(email) / addMultiple(emails)
   ▼
present, populated  ──has(email)──▶  true (probably seen) | false (definitely not seen)
```

- **Absent → present** is lazy and implicit: `loadOrCreate` (private) recreates an EMPTY filter on
  first write if the Redis key is missing — there is no "filter not initialized" error surfaced to a
  caller; a write path (account creation, OTP sign-up) never hard-fails just because init hasn't run
  yet or Redis was flushed.
- **has(email)** is the only read a caller needs. It is fail-open by design: an absent filter answers
  `false` ("not seen") rather than throwing, because bloom-filter absence must never block sign-up —
  the DB's own unique constraint is the actual gate; this is only a fast-path hint.
- **Invariant a bloom filter gives you for free**: no false negatives, but false positives are
  possible by construction — `has(email)` returning `true` does NOT prove the email exists; only a
  `false` is a hard guarantee ("definitely never added"). Any caller that treats a `true` as
  authoritative (rejecting sign-up outright on a bloom hit, without a DB re-check) would be
  introducing a bug the filter's own math warns against; this codebase's actual callers (see the
  synchronizer + sign-up handlers) use it as a pre-check, not a verdict.

## How the filter gets populated

Two paths write into it:
1. **Bulk sync** — `BloomFilterSynchronizerService.sync()` (`src/modules/init/synchronizers/...`)
   walks every `UserEntity` in keyset-paginated batches (ordered + filtered by `id > resumeAfterId`)
   and `addMultiple()`s each batch's emails. Run at init / on demand, not on a request path.
2. **Per-signup add** — the Keycloak `exchange-code-for-token` and `sign-up/verify-otp` handlers add a
   freshly-created user's email as it is created, so the filter stays current between full syncs
   without waiting for the next batch run.

## What the FE can read off this

Nothing directly — there is no GraphQL surface for this domain; it backs the sign-up mutations'
internal duplicate-email pre-check. The FE-visible effect is indirect: a sign-up attempt with an
email the filter (or the DB) already holds is rejected by whichever handler consumes
`EmailBloomFilterService`, with the DB constraint remaining the actual source of truth for that
rejection.
