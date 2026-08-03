# weekly-challenge — states, transitions, invariants

Source: `src/modules/bussiness/weekly-challenge/` (`weekly-challenge.service.ts`,
`weekly-challenge.catalog.ts`, `types/`). Surfaced through `weeklyChallenge` (query, optional auth) and
`claimWeeklyChallengeReward` (mutation, required auth) under
`src/features/api/core/graphql/{queries/dashboard,mutations/profile}`.

## The idea: one shared, deterministic challenge event per ISO week

Unlike `kpi-reward` (a per-user self-set target), this domain picks the SAME single challenge for
EVERY user in a given ISO week — there is nothing to configure, nothing stored for the rotation
itself. The pick is a pure function of the calendar: `index = ISO-week-number % (count of all
challenges, ordered by id ASC)`. Nothing is written when a new week starts; both read paths
(`getWeeklyChallenge` and `claimReward`) independently re-derive the same index from `now()`, so they
can never disagree about which challenge is "this week's."

## States, per (user, ISO week)

1. **Not yet attempted** — viewer has no qualifying `user_challenge_submission_attempts` row for this
   week's challenge. `viewerPassed: false`, `coinReward: null`, `claimed: false`.
2. **Passed, unclaimed** — a "pass" mirrors the solved-challenges projection definition exactly: a
   submission attempt with `score > 0` and a non-null `processed_at`, filtered to attempts processed
   inside the current ISO week window. `viewerPassed: true`, `coinReward: WEEKLY_CHALLENGE_REWARD_COIN`
   (40, a fixed 2x multiple of a regular challenge's flat reward — see `weekly-challenge.catalog.ts`),
   `claimed: false`.
3. **Claimed** — `claimReward` re-verifies the pass (never trusts the read path's cached view), checks
   no `WeeklyChallengeClaimEntity` row exists yet for `(userId, weekStart)`, grants the Coin via the
   shared `writeCoinHistory` ledger with a unique `refId = weeklyChallenge:${userId}:${weekStart}`, and
   inserts the claim row — all inside one transaction, so a concurrent double-claim can't double-credit
   even before the unique-`refId` safety net would catch it.
4. **Week rolls to a new ISO week** — a new challenge is picked automatically (pure function of the
   calendar); the previous week's claim row is historical and untouched.

## Invariants

- **The challenge pick is deterministic and never persisted** — `getWeeklyChallenge` and `claimReward`
  compute it independently from `now()` each time, so there is no "rotation table" that could drift out
  of sync with what a viewer actually sees.
- **A reward is claimable at most once per user per ISO week**, enforced both by the
  `WeeklyChallengeClaimEntity` existence check inside the transaction AND by `writeCoinHistory`'s
  unique `refId` (the same belt-and-suspenders pattern as `kpi-reward`).
- **Claiming re-derives eligibility from scratch** — it does not trust whatever `viewerPassed` the
  client last saw from `getWeeklyChallenge`; a client cannot forge a claim by skipping the read.
- **Anonymous viewers** get a fully-formed challenge view (title, leaderboard, passed count) with
  `viewerPassed: false` and no claim state — the event itself is public, only the personal
  pass/claim state requires identity.

## What a front-end screen can rely on

- Every signed-in AND anonymous viewer sees the exact same `challengeGlobalId` / `title` /
  `leaderboard` for the week — this is a shared event, not personalized content.
- `coinReward` being non-null is the UI's only signal that a claim button should render — it is
  computed off `viewerPassed`, and only present when there's actually something to claim.
