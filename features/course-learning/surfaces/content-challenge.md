# Surface · Content challenge

> ID: `content-challenge` · Route: `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]{/result}`

## Job

Complete a recoverable applied-learning attempt and receive trustworthy evidence-linked feedback without leaving the course context.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `challenge-briefing` | content | Task; Success criteria; Permitted help; Attempt history | pending, ready, locked, failed | Resume draft, Back to lesson | `EV-004`, `EV-016` |
| `challenge-workbench` | form | Answer or artifact; Draft status; Progressive hints | ready, draft, saving, submitting, failed | Save draft, Get a hint, Submit attempt | `EV-016`, `EV-017` |
| `challenge-evaluation` | flow | Evaluation progress; Recovery status | pending, evaluating, evaluation-unavailable | Resume evaluation | `EV-016`, `EV-017` |
| `challenge-result-history` | summary | Outcome; Criterion evidence and gaps; Next action; Attempt history | passed, needs-revision, evaluation-unavailable | Revise and retry, Back to lesson | `EV-005`, `EV-016`, `EV-017` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy. AI evidence is advisory; the rendered result must identify the platform-owned final outcome and must not imply that model text changed progress directly.
