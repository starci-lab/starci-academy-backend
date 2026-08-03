# weekly-challenge — findings

Graded against `.claude/canon/be/enforce/authoring/{error-handling,testing}.md` and read for defect
independent of canon. Scope read: `src/modules/bussiness/weekly-challenge/*` and its two resolvers
(`dashboard/weekly-challenge`, `claim-weekly-challenge-reward`).

## 1. [business-logic] The "deterministic, always-agrees" pick is only stable if the challenge catalog doesn't change mid-week — editing challenges can swap which one is "this week's" between read and claim

- **Anchor**: `src/modules/bussiness/weekly-challenge/weekly-challenge.service.ts:64-89`
  (`getWeeklyChallenge`, picks via `OFFSET (EXTRACT(WEEK FROM now())::int % $1)` where `$1 = COUNT(*) FROM challenges`, computed fresh) and `:168-191` (`claimReward`, the SAME formula, re-counted and re-picked independently). The class JSDoc (`:41-49`) states the rotation is *"a pure function of the calendar (nothing stored for it)"* and both call sites are described as computing "the same index."
- **Rule broken**: no single enforce/ rule names this shape, but it contradicts the domain's own
  documented invariant — the pick is a pure function of `now()` AND the live challenge count, and the
  live count is not calendar-stable. If an admin adds or removes a `ChallengeEntity` between the moment
  a user's `getWeeklyChallenge` read showed them `viewerPassed: true` and the moment they click claim,
  `total` (the modulus) changes, so `OFFSET (weekNum % total)` can select a DIFFERENT challenge for the
  claim than the one the user actually solved and was shown.
- **What breaks**: `claimReward` re-derives `didViewerPass(newChallengeId, userId)` against the newly
  (differently) picked challenge (`:191-197`) — a user who genuinely passed the challenge they were
  shown gets `WeeklyChallengeRewardNotEligibleException` on claim, with nothing in the response
  distinguishing "you didn't pass" from "the challenge changed under you." This is a narrow window
  (only matters if the catalog is edited while the ISO week is live) but the domain has no guard
  against it — no snapshot of "the week's challenge id" is ever persisted, so there is nothing to
  detect the drift with.

## 2. [test-tier] Zero unit specs for `WeeklyChallengeService`

- **Anchor**: `src/modules/bussiness/weekly-challenge/` has no `*.spec.ts` file. The deterministic pick
  math, the pass-detection window (current-ISO-week filter on `processed_at`), the claim's
  already-claimed guard, and the transaction boundary (`:168-250`) are all untested.
- **Rule broken**: `testing.md` §1.
- **What breaks**: this is the one lane that could have caught #1 above with a test asserting "a
  challenge added between the pick and the claim does not change the claim's target id" — no such
  test exists, so nothing currently protects against it regressing further (e.g., a future edit that
  removes the re-derivation and trusts a client-passed challenge id instead, reopening the "never
  trust a client-sent aggregate" rule from `validation.md` §7).

## 3. [error-handling, minor] "No challenges configured" and "you haven't passed" both throw the same `WeeklyChallengeRewardNotEligibleException`, whose fixed message names only the second cause

- **Anchor**: `weekly-challenge.service.ts:170-174` (`total === 0` → throws) and `:187-190`
  (`picked.length === 0` → throws) both raise `WeeklyChallengeRewardNotEligibleException`, whose
  constructor (`src/modules/exceptions/errors/weekly-challenge/weekly-challenge-reward-not-eligible.ts:19`)
  hard-codes the message *"the current challenge hasn't been passed."*
- **Rule broken**: judgment call, not a named canon rule — but the message actively misdescribes the
  first cause (an empty `challenges` table is an ops/seed problem, not a fact about whether this user
  passed anything).
- **What breaks**: if the `challenges` table is ever empty in an environment (a fresh seed, a bad
  migration), every claim attempt reports "you haven't passed the challenge" to ops/support, actively
  misdirecting triage away from the real cause (no challenges exist to pass). A distinct exception —
  or at least a distinguishing field — would make this diagnosable from the error alone.
