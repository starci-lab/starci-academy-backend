# Bloom Filters — findings

Ranked most severe first. Anchors are real `file:line` in the tree at scan time (2026-08-04).

## 1. [business-logic] `EmailBloomFilterService.has()` is dead code — the one real caller bypasses the service and reimplements it directly, with different (inconsistent) email normalization

`email.service.ts:128-141`'s `has(email)` is never called from anywhere in `src/` except its own
`.spec.ts`. `grep -rn "emailBloomFilterService\.has"` across the tree returns zero matches; the only
callers of `EmailBloomFilterService` at all are `exchange-code-for-token.handler.ts:121` and
`sign-up-verify-otp.handler.ts:167`, and both call `.add()` only (write, never read).

The actual bloom-filter READ that ships — `check-email-exists.handler.ts:39-56` — does not inject
`EmailBloomFilterService` at all. It injects the raw `CacheService`, re-reads the exact same
`{ key: CacheKey.BloomFilter, args: [BloomFilterType.Email] }` entry `has()` already wraps, and calls
`cached.scalableBloomFilter.has(normalizedEmail)` itself (:44-56) — duplicating the service's one
piece of read logic outside the service. Worse, it does so with a DIFFERENT normalization than the
write path: `check-email-exists.handler.ts:37` lower-cases + trims the email before checking
(`email?.trim().toLowerCase()`), while `email.service.ts`'s `add()`/`addMultiple()` (:78-116) and the
synchronizer's `users.map((user) => user.email ?? "")` (`bloom-filter-synchronizer.service.ts:118`)
never normalize before adding.

**What breaks**: (a) `EmailBloomFilterService.has()` is a public method with zero production callers —
the "read-only fast-path pre-check" this whole domain exists to provide is not the code path actually
serving `checkEmailExists`; (b) any email added with mixed case (`Foo@Example.com`, as Keycloak/DB may
store it) is checked against a lower-cased key, so `has()`/the duplicated inline check silently
under-reports true positives for anything but already-lower-case emails — already masked today because
the filter is fail-open by design, but it means the pre-check is weaker than either copy of the code
documents.

## 2. [jsdoc] The class itself carries no JSDoc; `get()`'s JSDoc restates its own name

`email.service.ts:16-17` — `export class EmailBloomFilterService` has no class-level doc at all (every
method inside is individually documented, but what the class IS / why it exists as a class is never
stated — contrast with `ai-lab`'s services, which open with a paragraph on their role). `get()`
(:23-34) carries `/** Get the bloom filter. @returns The bloom filter. */` — a comment that
tells the reader nothing `get()` didn't already say; `comments.md` §2 names this exact pattern
("do not comment a name that is already clear").

## 3. [naming / type-safety] No public method in the file declares an explicit return type

`get()` (:27), `add()` (:78-80), `addMultiple()` (:100-102), and `has()` (:128-130) all rely on
inference (`async get() {`, `async add(email: string) {`, …) rather than the explicit
`Promise<XResult>` `type-safety.md` §4 requires of every public service method. There is also no
`types/` folder for this domain to hold that result shape — the file returns the raw
`BloomFilterCacheResult | Awaited<ReturnType<CacheService["get"]>>` shape inferred from
`CacheService.get`/`.set()`, so a caller has to open `@modules/cache`'s own types to know what `get()`
hands back.

## 4. [edge-case] `add()` / `addMultiple()` is an unlocked read-modify-write against a single shared Redis key

`loadOrCreate()` (:49-72) reads the filter, and `add()`/`addMultiple()` (:78-116) mutate the in-memory
`ScalableBloomFilter` object and then `cacheService.set()` the whole thing back — with no lock, version
check, or optimistic-concurrency guard between the read and the write. Two concurrent sign-ups
(`exchange-code-for-token` and `sign-up-verify-otp` both call `.add()` on their own request) racing
against the SAME cache key can each load the pre-mutation filter, add their own email, and
write-back — the second write overwrites the first, silently dropping the first email from the filter.
Low real-world severity (the feature is fail-open and the DB constraint is the actual source of truth
per the file's own comment at :43-45), but it means the filter's effective recall degrades under
concurrent sign-ups, worth naming since nothing in the file flags the race.

## 5. [business-logic, adjacent / informational] A deprecated, unreferenced sibling class sits one folder over with a near-identical filename

`src/modules/init/synchronizers/bloom-filters-synchronizer/email.service.ts` defines
`EmailBloomFiltersSynchronizerService`, explicitly marked
`@deprecated Replaced by {@link BloomFilterSynchronizerService}. Kept for reference.` and referenced
nowhere else in `src/` (`grep -rn "EmailBloomFiltersSynchronizerService"` returns only its own
declaration). It is outside this scan's owned path
(`src/modules/bussiness/bloom-filters/`), so it is not graded here, but its filename
(`email.service.ts`, same as this domain's real file) and near-identical class name
(`EmailBloomFiltersSynchronizerService` vs. this domain's `EmailBloomFilterService`) make it an easy
zombie to open by mistake when searching for "the" email bloom filter service. Flagged for the
`init/synchronizers` bundle's own findings pass, not double-counted against this domain's axis tally.

---

**Axis tally**: business-logic 1, jsdoc 1, naming 1 (type-safety folded in), edge-case 1,
security 0, gate-middleware 0 (no GraphQL surface in this domain to gate), test-tier n/a (no
`.spec.ts` exists for `email.service.ts` at all — every method above is, in fact, also untested;
folded into finding 1's severity rather than listed separately).
