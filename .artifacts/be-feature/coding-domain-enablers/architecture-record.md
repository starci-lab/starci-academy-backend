# Architecture record — coding domain enablers

Status **`approved`** · app `core` · database `postgresql/primary` + Elasticsearch
catalog index · lock [`context-lock.plan.md`](context-lock.plan.md).

Serves `case-coding-practice` / `direction-path-first` in `starci-academy-fe`.

---

## What reading the schema changed

The frontend Plan proposed two enablers. Reading the operation list **unfiltered** — every query
folder, not a grep for `coding` — changed both of them, and killed most of the second.

### `userCodingSkills` already returns solved-per-domain

```
queries/users/user-coding-skills → UserCodingSkillsData {
    byLanguage:   [{ key, solved }]
    byDifficulty: [{ key, solved }]
    byDomain:     [{ key, solved }]   ← "Distinct problems solved, grouped by problem domain"
}
```

A grep for `coding-problem` or `my-coding-*` never reaches it, because it lives under `users/`. It
is served by `UserCodingProjectionService.getSkills`, whose SQL is
`COUNT(DISTINCT cs.coding_problem_id) … WHERE verdict = 'accepted' GROUP BY cp.domain`.

**So the `solved` half of the proposed `myCodingDomainProgress` is already shipped.** Building it
would have produced a second answer to a question this backend already answers.

### The catalog is Elasticsearch, and `domain` is already a keyword facet

`CodingProblemService.list` does not touch the entity manager for the list. It runs a
`bool.filter` search against the per-locale index, already returns `domain` in `_source`, and the
mapping says:

```ts
// problem domain (algorithms, data-structures, ...) -- exact-match facet
domain: { type: "keyword" }
```

The mapping author intended this field to be filtered on. A `term` filter and a `terms` aggregation
both work against it. **Verified in the mapping file rather than assumed** — this session has already
been bitten once by an index whose `courses` mapping lacked `title.keyword`, which made every sort
fail at runtime while the code looked correct.

### What is therefore genuinely missing

| Wanted by the hub | Status |
|---|---|
| Problems of one domain | **missing** — `list` filters `difficulty` and `tag` only |
| Solved count per domain | **exists** — `userCodingSkills.byDomain` |
| Total problems per domain | **missing** — no operation counts the catalog by domain |
| Attempted count per domain | **not needed** — see the decisions below |

---

## Enabler 1 · `domain` filter on `codingProblems`

No new folder. Four files change, and the family they belong to is resolver → service, with **no
command, no handler and no spec twin for reads** — that is this domain's convention and it is
mirrored rather than corrected here.

| File | What it holds | What decides its shape |
|---|---|---|
| `src/features/api/core/graphql/queries/coding/coding-problems/graphql-types/request.ts` | `domain?: CodingDomain` beside the existing `difficulty?` and `tag?` | mirrors `difficulty?` in the same file, field for field |
| `src/features/api/core/graphql/queries/coding/coding-problems/coding-problems.resolver.ts` | one more pass-through into `codingProblemService.list` | mirrors the two lines above it |
| `src/modules/bussiness/coding/types.ts` | `ListCodingProblemsParams` gains `domain?: CodingDomain` | the params type the service already destructures |
| `src/modules/bussiness/coding/coding-problem.service.ts` | one more `filter.push({ term: { domain } })` | mirrors the `difficulty` block six lines above |
| `src/modules/bussiness/coding/coding-problem.service.spec.ts` | **the spec exists already** and gains the cases below | `TESTING` — the file is there, so the cases go in it rather than into a new one |

Nothing else. No module change: the operation already exists and is already registered.

---

## Enabler 2 · `codingDomainSummary` — catalog totals per domain

The frontend proposed `myCodingDomainProgress → [{ domain, total, solved, attempted }]`.
**That shape is refused here, for three reasons the evidence forced.**

1. `solved` already exists. Returning it again from a second operation gives the product two answers
   to one question, which drift the first time one of them is changed.
2. `total` is a **catalog** fact, not a per-viewer one. Putting it in `UserCodingProjectionService`
   would recompute the same twenty numbers once per user, and — worse — that projection's listener
   subscribes to exactly one topic:
   ```
   groupId = "user-coding-projection"
   topics  = [ `${cdcTopicPrefix}coding_submissions` ]
   ```
   A catalog total is invalidated by writes to `coding_problems`, which that listener does not
   watch. The number would be silently wrong every time a problem was added, and nothing would say
   so. This is exactly the failure `cdc` warns about.
3. `attempted` is not needed — see the decisions.

So: **a new query returning only what is missing**, with no user, no projection, and no CDC.

### New folder — `src/features/api/core/graphql/queries/coding/coding-domain-summary/`

**Full CQRS, by owner instruction.** The first version of this record mirrored the `coding` folder
family — resolver → service, no message, no handler, no twin — and recorded the divergence as a
finding. The owner overrode it, and the evidence backs the override: **62 of the query folders in
this app carry a `.query.ts` and 64 carry a handler.** CQRS is the house law here and `coding` is
the outlier, so a new operation joins the law rather than the outlier.

| File | What it holds | What decides its shape |
|---|---|---|
| `coding-domain-summary.query.ts` | one `params: ExecuteParams<void>` field, no methods, no defaults | `CQRS-2`; mirrors `challenge-submissions.query.ts` |
| `coding-domain-summary.handler.ts` | **the work**: `@QueryHandler`, `extends ICQRSHandler<Query, ResponseData>`, `protected override async process(...)` running the aggregation | `CQRS-1`, `CQRS-3`; mirrors `challenge-submissions.handler.ts`, which injects its data source and queries directly |
| `coding-domain-summary.service.ts` | one line: `queryBus.execute(new CodingDomainSummaryQuery(params))` | `CQRS-4`; mirrors `challenge-submissions.service.ts` verbatim in shape |
| `coding-domain-summary.resolver.ts` | the door: `@Query(name: "codingDomainSummary")`, `KeycloakAuthGraphQLGuard`, `GraphQLTransformInterceptor`, one call into the service | `TRANSPORT-1`; mirrors `challenge-submissions.resolver.ts` |
| `coding-domain-summary.module.ts` | wiring | mirrors its CQRS sibling |
| `coding-domain-summary.module-definition.ts` | the configurable-module boilerplate | mirrors its sibling |
| `coding-domain-summary.handler.spec.ts` | **the twin** | `CQRS-7` — non-negotiable, and the file the old shape had no place for |
| `graphql-types/response.ts` | `CodingDomainCount { domain: CodingDomain, total: Int }`, `CodingDomainSummaryResponseData { domains: [CodingDomainCount] }`, `AbstractGraphQLResponse` wrapper | mirrors `coding-leaderboard/graphql-types/response.ts` |

There is deliberately **no `request.ts`**: the query takes no arguments, and no locale either. The
owner settled that totals always count the `en` index, so the handler resolves that index itself.

### Where the work moved, and why that is the real change

Complying with CQRS is not only four more files. **The aggregation moves out of
`CodingProblemService` and into the handler**, because `CQRS-1` says the folder holds the whole
operation and the sibling handler injects its own data source rather than delegating to a business
service. So:

- `coding-domain-summary.handler.ts` injects the Elasticsearch service, resolves the `en` index the
  same way `list` does, and runs a `size: 0` search with
  `filter: [{ term: { enabled: true } }]` and `aggs: { byDomain: { terms: { field: "domain", size: DOMAIN_COUNT } } }`.
- **`CodingProblemService` gains nothing.** No `countByDomain`, no new result type, no new spec
  cases there. That was the previous shape and it is withdrawn.
- The cases move with the work: they belong in `coding-domain-summary.handler.spec.ts`, which is
  where `CQRS-7` puts them.

`DOMAIN_COUNT` is the cardinality of `CodingDomain`, written as a named constant rather than `20`,
so a twenty-first domain is one edit rather than a silently truncated aggregation.

### Changed file

| File | What it holds | What decides its shape |
|---|---|---|
| `src/features/api/core/graphql/queries/coding/coding.module.ts` | registers `CodingDomainSummarySingleQueryModule` | mirrors the five imports already there |

### What CQRS does NOT extend to, and the owner should say so out loud

Enablers 1 and 3 add one field each to `codingProblems` and `myCodingProgress`. **Both of those
operations already exist and neither is CQRS today.** Adding a field does not make them CQRS, and
converting them is a refactor of shipped, called operations — a different job with a different risk
profile from adding one query.

So this record keeps them where they are, and names the choice rather than burying it:

| Operation | Today | This record |
|---|---|---|
| `codingDomainSummary` | does not exist | **full CQRS** |
| `codingProblems` | resolver → service | one field added, shape untouched |
| `myCodingProgress` | resolver → service | one field added, shape untouched |

If the intent was "convert the whole `coding` domain to CQRS", that is a third piece of work — seven
operations, each gaining a message, a handler and a twin spec — and it should be its own record
rather than a side effect of two enablers.

---

## Enabler 3 · `byDomain` on `myCodingProgress` — settled by the owner

The owner chose this over reading `userCodingSkills` with the viewer's own id, so the hub does not
depend on how `GraphQLProfileVisibilityGuard` treats a profile's own owner.

**It is NOT a fourth query inside `CodingProgressService.compute`.** That method runs three
`SELECT DISTINCT` statements plus a points read and caches the lot behind its own `invalidate`.
Adding the per-domain rollup there would duplicate, character for character, the SQL already living
in `UserCodingProjectionService.buildUpsertSql`:

```sql
SELECT cp.domain::text AS domain, COUNT(DISTINCT cs.coding_problem_id)::int AS solved
FROM coding_submissions cs JOIN coding_problems cp ON cp.id = cs.coding_problem_id
WHERE cs.user_id = $1 AND cs.verdict = 'accepted'
GROUP BY cp.domain
```

Two copies of one GROUP BY is two truths, and it would also stack two staleness policies over the
same number — the progress cache's and the projection's TTL.

**So the resolver composes instead.** It already has the viewer; it gains one more service call.

| File | What it holds | What decides its shape |
|---|---|---|
| `src/features/api/core/graphql/queries/coding/my-coding-progress/my-coding-progress.resolver.ts` | one more call into `UserCodingProjectionService.getSkills(userId)`, taking `byDomain` only | mirrors `user-coding-skills.resolver.ts`, which is already a thin projection read |
| `src/features/api/core/graphql/queries/coding/my-coding-progress/graphql-types/response.ts` | `byDomain: [CodingDomainSolvedCount]` beside the three id arrays | mirrors `UserCodingSkillCount` in `user-coding-skills/graphql-types/response.ts` |
| `src/features/api/core/graphql/queries/coding/my-coding-progress/my-coding-progress.module.ts` | imports the user-coding projection module | mirrors how `user-coding-skills.module.ts` obtains it |

No new SQL. No change to `CodingProgressService`, its cache or its `invalidate`. No change to the
projection or its listener.

**Wiring note for Apply:** this makes `queries/coding/my-coding-progress` depend on
`modules/bussiness/projections/user-coding`. Both are under `modules/bussiness`, and
`user-coding-skills` already takes exactly that dependency from `queries/users`, so the direction is
established rather than new.

## The zero-solve gap, and where it is answered

`byDomain` is a `GROUP BY`, so **a domain the learner has never solved in produces no row at all**.
The hub needs all twenty, including the ones at zero.

This is **not** fixed in the backend. Zero is the absence of a row, and the twenty-member enum is
already public. The frontend composes: for each `CodingDomain`, `total` from `codingDomainSummary`,
`solved` from `userCodingSkills.byDomain` defaulting to `0`. Stated here so Apply does not "fix" it
by making the projection emit twenty rows per user.

---

## Failures

**No new exception class.** Both operations are catalog reads over an index that already returns an
empty page when missing — `list` documents that ES throws only on a missing index and it is caught.
A failure a caller would act on differently from its neighbour earns its own class; neither of these
produces one.

`codingDomainSummary` on a missing index returns an empty `domains` array, exactly as `list` returns
an empty page. That is a real state the frontend must draw, not an error.

---

## Decisions the evidence forced

| Decision | Evidence |
|---|---|
| **The new query is full CQRS** — message, handler, dispatch service, door, wiring, twin spec | Owner instruction, and the count backs it: **62 query folders carry a `.query.ts`, 64 carry a handler**. The `coding` folder family is the outlier, not the law. This REVERSES the first version of this record, which mirrored the local family and recorded the divergence as a finding — the finding stands, but the new operation joins the law. |
| **The aggregation lives in the handler, not in `CodingProblemService`** | `CQRS-1`: the folder holds the whole operation. The sibling `challenge-submissions.handler.ts` injects its own data source and queries directly rather than delegating to a business service. |
| **The two extensions stay non-CQRS** | They are one added field each on shipped operations. Converting them is a refactor of called code and belongs in its own record. |
| `total` does **not** enter the user projection | its listener watches `coding_submissions` only; a catalog count is invalidated by `coding_problems` |
| `solved` is **not** re-served | `userCodingSkills.byDomain` already returns it |
| The aggregation is Elasticsearch, not Postgres | the catalog list is already ES, `domain` is already a `keyword`, and a second read store for one count would be a second truth |
| `attempted` per domain is **dropped** | the selected direction marks "in progress" with the resume card, which names one problem and already knows its domain. Nothing on the hub needs an attempted COUNT per domain. |

## Assumptions

Two were put to the owner and are now **settled**; they are recorded as decisions rather than
guesses, which is the whole reason this half stops before writing anything.

1. **SETTLED — the viewer's per-domain solved count comes from `myCodingProgress`, not from
   `userCodingSkills`.** The owner chose the new field over depending on how
   `GraphQLProfileVisibilityGuard` treats a profile's own owner. See enabler 3.
2. **SETTLED — `codingDomainSummary` always counts the `en` index.** A domain's problem count is a
   fact about the catalog, not about which translations exist, so every reader sees the same twenty
   numbers. Without this, two learners would see different totals for the same domain and neither
   would be wrong.
3. **`enabled: true` is the only catalog gate.** Taken from `list`, which filters on nothing else.
   Still an assumption, but a cheap one: it is one predicate, in one place.

## Proof plan — cases enumerated now, before the branches exist

`coding-problem.service.spec.ts`, `list`:

- domain filter absent → no `domain` term in the query body
- domain filter present → exactly one `term: { domain }` appended, and the existing `enabled` term retained
- domain **and** difficulty **and** tag together → four filter clauses, none dropped
- a domain with no problems → empty page, `total: 0`, not an error
- an unknown enum value cannot be constructed — the GraphQL enum refuses it at the door, so this is a schema case rather than a service case, and it is recorded as such rather than tested twice

`coding-problem.service.spec.ts`, `countByDomain`:

- every one of the **twenty** `CodingDomain` values that has documents comes back
- a domain with zero documents is **absent** from the aggregation — asserted deliberately, because it is the behaviour the frontend composes against
- `size: 0` — the search returns no hits, only buckets
- `enabled: false` documents are excluded from the counts
- missing index → empty array, matching `list`'s caught behaviour
- the terms `size` equals the enum cardinality, so a twenty-first domain is not silently truncated

End-to-end flow:

- authenticate through the production transport
- `codingDomainSummary` → twenty-or-fewer buckets
- `codingProblems(filters: { domain })` → only that domain, `total` consistent with the bucket
- the same call without `domain` → the unfiltered total, proving the filter is additive
- refusal: unauthenticated `codingProblems` is rejected by `KeycloakAuthGraphQLGuard`, exactly as today

## What this will NOT do

- **No `attempted` per domain.** Dropped with a reason above; if the hub later needs it, that is a
  new proposal, not a silent widening.
- **No zero-filling.** The frontend composes the twenty-member enum against the buckets.
- **No migration.** Neither enabler adds a column, a table or an index; `domain` is already stored,
  already synchronized and already mapped as a keyword.
- **No change to `CodingProgressService`**, its cache or its `invalidate`. The new field is composed
  in the resolver from a projection this repository already maintains.
- **No projection change.** `UserCodingProjectionService` and its listener are untouched.
- **No locale-aware totals.** Settled: always `en`.
- **It does not make the frontend's hub buildable on its own.** The frontend still needs three
  dependencies it does not have — CodeMirror 6, a socket client and a markdown renderer — and those
  are its Preview's problem, not this record's.

---

## Approval

**Approved** by the owner: *"duyet"*, on 2026-08-14, after both assumptions were settled and after
the CQRS shape was corrected on their instruction.

What that approves: `codingDomainSummary` as a full CQRS folder, and one added field each on
`codingProblems` and `myCodingProgress` with their existing non-CQRS shape untouched.

What it does **not** approve: converting the seven existing `coding` read operations to CQRS. That
was offered as a separate record and was not asked for.

Routed to `$starci-be-feature-apply`.
