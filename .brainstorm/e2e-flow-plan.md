# The e2e flow inventory, and what the unit lane owes

Derived from the 153 CQRS operations in `src/features/api/core`, not from the existing e2e
filenames. The existing files are the INPUT to this table, not its shape: 14 of them are named for a
resolver group rather than a flow, and those names are what this replaces.

Governing law: `.claude/be/canon/patterns/testing.md`.

## The rule this table applies

One file, one business flow, start to finish, named for the sentence. The assertion is the
consequence — a row, a balance, an entitlement, a delivered message — never the response envelope.
The model is overridden with Jest in every row here; nothing in this lane calls a provider.

## Money — the flows the business is

| Flow | The sentence | Steps | Asserts | Transport | Replaces |
|---|---|---|---|---|---|
| `course-purchase` | A learner buys a course and can start it | cart -> checkout -> provider webhook PAID -> enrollment -> XP | enrollment row `isEnrolled`, wallet debit, XP delta | http, db, poll | `courses-checkout`, `course-enroll` |
| `course-refund` | The bank fails after capture, so the money and the access both go back | capture -> settlement failure -> refund -> entitlement closes | refund state, wallet restored, `isEnrolled` false | http, db, poll | NEW - no refund flow exists today |
| `course-trial` | A learner tries a course without paying, and the trial ends | start-trial -> trial enrollment -> expiry | trial row not `isEnrolled`, access before and after expiry | http, db | part of `course-enroll` |
| `membership-purchase` | A learner buys membership and the entitlements change | purchase -> webhook -> membership active | membership row, entitlement visible on a gated read | http, db, poll | `purchase-membership` |
| `installment-plan` | A learner pays a course off over time | checkout on a plan -> pay next -> final payment | schedule advances, plan closes, access opens at the right step | http, db, poll | `installment-payment`, `installment-plan-queries` |
| `ai-subscription-purchase` | A learner buys AI credit and the tier unlocks | purchase -> webhook -> tier + quota | tier row, quota reflects the purchase | http, db, poll | part of `content-ai-entitlement` |
| `payment-idempotency` | The provider calls twice and nothing doubles | webhook -> duplicate webhook | one grant, one ledger row, second call is a no-op | http, db | `xp-history-idempotency`, `transaction-grant-concurrency`, 3 webhook files |

## Access — who the learner is

| Flow | The sentence | Steps | Asserts | Transport | Replaces |
|---|---|---|---|---|---|
| `signup-and-signin` | A stranger registers, verifies and gets in | sign-up init -> OTP -> sign-in -> me | user row, session token works, `me` answers | http, db | part of `two-factor`, `profile` |
| `password-reset` | A locked-out learner gets back in | forgot init -> OTP -> reset -> sign-in | old credential rejected, new one works | http, db | none today |
| `two-factor` | A learner turns on 2FA and it is then required | enrol -> challenge -> sign-in | factor row, sign-in without the code is refused | http, db | `two-factor` |
| `session-lifecycle` | A token is refreshed, then signed out and dead | refresh -> use -> sign-out -> reuse | new token works, old refresh rejected after sign-out | http, db | none today |
| `github-account-link` | A learner links GitHub and it shows on the profile | redirect -> callback -> link | link row, `me` reflects it | http, db | none today |

## Learning — what the product is for

| Flow | The sentence | Steps | Asserts | Transport | Replaces |
|---|---|---|---|---|---|
| `content-progress` | A learner reads a lesson and the progress follows | open -> mark read -> favourite -> progress | progress row, streak, XP, saved list | http, db | `content-progress`, `progress-query`, `progress-dashboard` |
| `content-ai-session` | A learner asks about a lesson and the session is kept | ask (model stubbed) -> follow-up -> reload | session + turns persisted, quota spent, entitlement enforced | http, db, ws | `content-ai-session`, `content-ai-queries`, `content-ai-entitlement` |
| `challenge-submission` | A learner submits, is graded and scores | submit -> sync -> feedback -> attempt | submission row, feedback, attempt count, XP, leaderboard | http, db, poll | `challenge-submission`, `coding-submission`, `coding-queries` |
| `flashcard-session` | A learner reviews a deck and the schedule moves | start -> sync progress -> close | session row, per-card SR schedule, stats, XP | http, db | 5 flashcard files |
| `mock-interview` | A learner runs an interview and gets a grade | start -> sync turns -> grade | session, turns, grade persisted | http, db, poll | none today |
| `cv-build` | A learner turns a document into a tailored CV | upload -> extract -> blocks -> generate -> tailor -> render | blocks persisted, generation row, render artifact | http, db, poll | `cv-submission-blocks`, `cv-submission-generation` |
| `personal-project` | A learner submits a repo and gets a review | submit url -> sync -> review task | project row, sync result, feedback | http, db, poll | `personal-project` |
| `course-catalogue` | A visitor finds a course and sees what it holds | search -> suggest -> course -> outline | result shape, ordering, gated fields absent when not enrolled | http, db | `learner-cms-queries`, part of catalogue queries |

## Engagement — what brings them back

| Flow | The sentence | Steps | Asserts | Transport | Replaces |
|---|---|---|---|---|---|
| `daily-quest` | A learner completes the day's quest and claims it | list -> complete -> claim -> claim again | quest state, reward lands once, second claim is a no-op | http, db | `daily-quest`, `kpi-reward-queries` |
| `rewards-redeem` | A learner spends what they earned | earn -> redeem -> redeem again | wallet debit, redemption row, idempotent repeat | http, db | `rewards-redeem`, `rewards-queries` |
| `streak-freeze` | A missed day does not break the streak | miss -> freeze consumed -> streak held | freeze count, streak preserved, second miss breaks it | http, db | `streak-freeze` |
| `notification-delivery` | Something happens and the learner is told | trigger -> persist -> deliver | notification row AND the socket message | http, db, **ws** | `notifications`, `notification-queries` |
| `community-thread` | A learner posts, is replied to and is notified | post -> reply -> follow -> notify | thread rows, follow row, notification delivered | http, db, **ws** | `community`, `discussion`, `follows`, `chat` |

## Hiring — the other side of the marketplace

| Flow | The sentence | Steps | Asserts | Transport | Replaces |
|---|---|---|---|---|---|
| `job-application` | A learner applies and the company sees it | browse -> apply -> company view | application row, visibility from both sides | http, db | `job-postings`, `jobs-queries`, `headhuntings-queries` |

## What this changes

Twenty-six flows define the canonical business inventory. Every `*-queries` name eventually
disappears, because a query
group is not a flow; the queries that mattered are asserted INSIDE the flow that produces the data
they read, which is also the only way to know the query answers correctly after a write.

Four flows are new and none of them is optional: `course-refund` was named as the reason this lane
exists, `password-reset` and `session-lifecycle` are access paths with no coverage at all, and
`mock-interview` is a shipped feature with none.

Two flows must open a real socket. Today exactly one file does, while `chat`, `notifications`,
`community` and `discussion` all test the HTTP half of a realtime flow and stop.

## Completion gate

All 26 canonical filenames are machine-checked by
`scripts/check-e2e-flow-inventory.mjs`. The complete lane remains larger while legacy decision and
query-group suites are migrated into unit specs or folded into their owning business flow.

## What the unit lane owes

The e2e table above says nothing about whether a DECISION is right — it only proves the flow runs.
Every branch that changes an outcome is a unit case, and these are where the branches are:

| Area | The decisions | Where |
|---|---|---|
| pricing | coupon, membership discount, installment split, currency rounding | `courses-checkout` pricing service |
| entitlement | paid vs enrolled vs trial vs expired, AI tier gates | `ai-entitlement`, course enrollment status |
| grading | floor per submission type, retry cap, partial credit | challenge + milestone + interview grading |
| quota | spend, refill boundary, exhaustion, the off-by-one at the cap | AI quota |
| scheduling | SR interval per answer grade, due-set boundaries | flashcard sessions |
| idempotency | duplicate webhook, duplicate claim, concurrent grant | payment + reward handlers |
| authorization | owner vs other vs admin on every read that can leak | every query handler with a user filter |

The criterion is the branch, not the line: a case per outcome the code can produce, including the
boundary and the already-done. A handler with no branch needs no unit spec — its flow test is enough.
