# kpi-reward — states, transitions, invariants

Source: `src/modules/bussiness/kpi-reward/` (`kpi-reward.service.ts`, `kpi-reward.catalog.ts`,
`types/`). Surfaced through three GraphQL leaves: `setKpiTarget` (mutation), `claimKpiReward`
(mutation), `myKpis` (query) — all under `src/features/api/core/graphql/{mutations/profile,queries/dashboard}`.

## The idea: a weekly commitment with an anti-gaming floor

Each user can self-set a weekly numeric target for six KPIs (`KpiKey`: Lessons, StudyDays,
Challenges, Coding, Flashcards, Milestones). Hitting a target pays a one-time Coin reward, once per
KPI per week. The wrinkle this whole domain exists to solve: a naive "current value >= target"
gate is gameable — lower your target mid-week AFTER you already know you'll clear a lower one, and
you'd claim a reward for a commitment you never actually took on. The FLOOR fixes this.

## States, per (user, KPI, week)

1. **No target set this week** — `weeklyKpiTargets[key]` on the user row is unset or `0`.
   `myKpis` shows the KPI with `target: null`, no reward, `canClaim: false`.
2. **Target set, floor tracking begins** — `setKpiTarget` writes the clamped value (into
   `[0, MAX_TARGET[key]]`) onto the user row, then `lowerFloor` seeds or lowers a
   `kpi_weekly_reward_floors` row for the current KPI week. **The floor can only go DOWN within a
   week** (`LEAST(existing, new)` on every touch) — raising your target after the fact never raises
   what counts as "cleared."
3. **Eligible, unclaimed** — the projected current value (`UserStatsProjectionService`) has reached
   the FLOOR (not the live target). `canClaim: true`.
4. **Claimed** — `claimReward` runs eligibility + already-claimed checks, grants
   `computeKpiCoinReward(key, floorTarget)` Coin via the shared `writeCoinHistory` ledger, and stamps
   `claimedAt` + `coinReward` on the floor row, all inside one transaction keyed by a unique
   `refId = kpi:${key}:${weekStart.toISOString()}` — a concurrent double-claim cannot double-credit.
5. **Week rolls over** (Monday 8am Asia/Ho_Chi_Minh, `KPI_WEEK_START_SQL`) — a new floor row is
   created fresh next touch; the previous week's floor/claimed state is historical, never mutated.

## Invariants

- **The floor never rises within a week.** Enforced in SQL (`ON CONFLICT ... DO UPDATE SET
  floor_target = LEAST(...)`), not in application code — a client cannot "up" its own floor by
  raising the target after partially clearing a lower one.
- **A KPI can be claimed at most once per week.** Enforced by `floorRow.claimedAt` inside the same
  transaction that grants the Coin, and independently by `writeCoinHistory`'s unique `refId`
  (belt-and-suspenders against a double-claim race).
- **The reward amount is fixed by the FLOOR, not the live target or the live current value.**
  `computeKpiCoinReward` reads only `floorTarget` — someone who raises their target after clearing a
  lower floor gets paid for the floor they actually cleared, not the (possibly much higher) target
  now displayed.
- **A KPI with no floor row and no current target is simply absent from `getFloorStates`'s result**
  — `myKpis` treats "never touched this week" as `target: null`, not as a zero-progress claimable KPI.
- **Coin amount per unit is a per-KPI multiplier, not flat** (`KPI_REWARD_PER_UNIT_TARGET`) — deliberately
  calibrated so a high-volume, low-effort KPI (Flashcards, up to 300/week) doesn't out-earn a
  low-volume, high-effort one (Milestones) just by grinding a bigger number.

## What a front-end screen can rely on

- `myKpis`'s `target` is the user's LIVE self-set value; `coinReward`/`claimed`/`canClaim` are computed
  off the FLOOR, which can be lower than the displayed target — a screen showing "target: 50,
  reward available" is not a contradiction, it means the floor is still <= the current value even
  though the displayed target was raised since.
- Setting a target to `0` clears it (no floor tracking starts) rather than committing to "zero."
