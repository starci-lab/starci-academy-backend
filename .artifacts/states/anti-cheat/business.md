# Anti-cheat — business map

Source read: `src/modules/bussiness/anti-cheat/**` (no `.module.ts`), and its one call site,
`src/modules/bussiness/coding/coding-submission.service.ts`. No GraphQL resolver anywhere reads the
output this domain produces — see the invariant below.

## Entities

`AntiCheatService` is pure and stateless — it owns no entity of its own. It reads nothing and writes
nothing; it is a scoring function over caller-supplied input, called once per coding submission. Its
output is persisted onto columns that live on `CodingSubmissionEntity` (owned by the `coding` domain,
not this one): `deviceFingerprint`, `clientTelemetry` (raw JSON, telemetry + computed reasons),
`suspicionScore`, `flaggedForReview`.

`CodingClientTelemetry` (client-reported, all fields optional): `pasteCount`, `pasteSizeMax`,
`keystrokeCount`, `tabBlurCount`, `timeOpenToSubmitMs`.

## States

A single coding submission's anti-cheat outcome is exactly one of:

1. **Unscored / no signal** — the client sent no `telemetry` at all (documented as "old clients").
   `suspicionScore = 0`, `flagged = false`, `reasons = []`. Indistinguishable, by design, from a
   perfectly organic submission that tripped none of the five heuristics.
2. **Scored, not flagged** — one or more heuristics fired but the summed score stayed below 60.
3. **Scored, flagged for review** — summed score ≥ 60 (`FLAG_THRESHOLD`). Score is clamped to a max of
   100 (`MAX_SCORE`) even if every heuristic fires (a theoretical max of 115).

## Transitions

- **Submission time only.** `evaluate()` runs exactly once, inline, inside `CodingSubmissionService.submit()`,
  before the submission row is persisted. There is no re-scoring, no appeal flow, no re-evaluation once
  the row exists — the score and flag are frozen at insert time.
- **Flagging never blocks the submission.** `flagged: true` only sets `flaggedForReview = true` on the
  row; the submission is judged normally regardless (Judge0 job still enqueued). This is a detection
  mechanism, not a prevention one, by explicit design (`anti-cheat.service.ts:15-21` docblock).

## Invariants

- **The five heuristics are independent and additive** — paste count > 3 (+25), a single paste
  covering ≥ 60% of the final code (+30), keystrokes under 30% of code length (+25), a non-trivial
  (> 200 char) solution submitted within 15 seconds of opening (+20), and > 5 tab-blur events (+15).
  Each is guarded so a zero/absent denominator (`codeLength`, `timeOpenToSubmitMs`) contributes nothing
  rather than false-flagging.
- **Missing telemetry is a fail-OPEN state, not fail-closed** — `evaluate({ telemetry: undefined, ... })`
  always returns `suspicionScore: 0, flagged: false`. This is the load-bearing invariant a FE reader
  must know: the entire mechanism is opt-in from the client's point of view. See `findings.md` for why
  that is a real weakness rather than only a documented tradeoff.
- **Output is currently a dead end.** `flaggedForReview` / `suspicionScore` / `clientTelemetry` are
  written to `coding_submissions` and never read back by any resolver, admin query, or job in this
  codebase — there is no reviewer-facing surface yet. A FE built today has nothing to point a "flagged
  submissions" admin view at; that surface does not exist.
