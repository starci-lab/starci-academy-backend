# kpi-reward — findings

Graded against `.claude/canon/be/enforce/authoring/{naming-and-structure,testing}.md`. Scope read:
`src/modules/bussiness/kpi-reward/*` and its three resolvers (`claim-kpi-reward`, `set-kpi-target`,
`dashboard/my-kpis`).

## 1. [naming / business-logic] `SetKpiTargetResolver` bypasses `KpiRewardService` entirely — raw ORM write plus a business clamp live in the composition layer

- **Anchor**: `src/features/api/core/graphql/mutations/profile/set-kpi-target/set-kpi-target.resolver.ts:40-47` (`MAX_TARGET`, a per-KPI business ceiling, defined as a local constant in the resolver file) and `:59-61,85-107` (the resolver injects `EntityManager` directly and runs a raw `UPDATE users SET weekly_kpi_targets = jsonb_set(...)` itself, clamping the value with `Math.min(Math.max(...))` inline).
- **Rule broken**: `naming-and-structure.md` §5 — *"The leaf's own service stays thin — it reads, it maps, it hands anything rule-bearing to the capability layer... A resolver or controller reaching straight for the ORM is the anti-pattern."* `KpiRewardService` already exists as the capability for this exact domain (it's injected into this very resolver for the OTHER half of the same mutation, `lowerFloor` at `:111-116`) — the resolver reaches past it for the write half instead of adding a `setTarget` method beside `lowerFloor`.
- **What breaks**: the clamp range (`MAX_TARGET`) and the write SQL live nowhere near `kpi-reward.catalog.ts`, where `KPI_REWARD_PER_UNIT_TARGET` (the sibling per-KPI constant table) already lives — a future change to either has to remember the other exists in a different file, in a different layer. Worse: this resolver is the ONE place in the whole `kpi-reward` surface not covered by `KpiRewardService`'s own tests (which don't exist either, see #2) or any resolver-level test — the jsonb-merge SQL and the clamp math are exercised by nothing.

## 2. [test-tier] `KpiRewardService` has zero unit specs despite being the one place real Coin gets granted

- **Anchor**: `src/modules/bussiness/kpi-reward/` contains no `*.spec.ts` file at all (`kpi-reward.service.ts`, `kpi-reward.catalog.ts` are both untested).
- **Rule broken**: `testing.md` §1 — a branchy, transactional service (lazy floor-seed, already-claimed guard, floor-vs-current eligibility check, one atomic transaction) is exactly the shape this lane exists for, and it is the cheapest of the three lanes to write.
- **What breaks**: the floor anti-gaming invariant — "the floor can only lower within a week"
  (`kpi-reward.service.ts:74-92`, enforced by a `LEAST(...)` in raw SQL) — has no regression test.
  A future refactor that swaps the `ON CONFLICT ... DO UPDATE SET floor_target = LEAST(...)` for a
  plain upsert would silently reopen the exact exploit this domain was built to close (raise-then-lower
  gaming a lower floor after already clearing it), and nothing would fail red.

## 3. [edge-case, judgment] `claimReward`'s lazy floor-seed reads the CURRENT target at claim time, not at `myKpis`-view time — a display/claim time-of-check mismatch, currently harmless

- **Anchor**: `kpi-reward.service.ts:167-187` — when no floor row exists yet this week, the floor is
  seeded from `user.weeklyKpiTargets?.[key]` read fresh inside the claim's own transaction, not from
  whatever `myKpis` showed the user moments earlier.
- **Judgment, not a canon breach**: today this is harmless — the JSDoc calls it out explicitly ("safe:
  nothing has moved it this week") and it IS the first touch, so there is nothing to be inconsistent
  with. It becomes worth a comment-level warning only if a future change lets `setKpiTarget` be called
  between a `myKpis` read and a `claimReward` call within the same user action (e.g., an optimistic-UI
  flow that raises the target then immediately claims) — worth a one-line note so nobody "fixes" the
  claim path to trust a client-supplied target instead.
