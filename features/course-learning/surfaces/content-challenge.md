# Surface · Content challenge

> ID: `content-challenge` · Route: `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]{/result}`

## Job

Complete a recoverable applied-learning attempt and receive trustworthy evidence-linked feedback without leaving the course context.

## Navigation

- Course / Module / Lesson / Challenge → `course-content-context`

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `challenge-briefing` | content | Overview; Prerequisites; Scored requirements; Guided steps; Expected outputs; Hint and permitted help; Attempt history | pending, ready, locked, failed | Back to lesson | `EV-004`, `EV-016`, `EV-019`, `EV-020` |
| `challenge-workbench` | form | Required deliverables; Grading model; Draft status; Progressive hints | ready, draft, saving, failed | Save draft, Get a hint, Review attempt | `EV-016`, `EV-017`, `EV-018`, `EV-019`, `EV-020` |
| `challenge-review` | overlay | Deliverables snapshot; Selected grading model; Immutable submission effects | reviewing, submitting, failed | Continue editing, Confirm and submit | `EV-018`, `EV-020` |
| `challenge-evaluation` | flow | Evaluation progress; Selected model; Recovery status | pending, evaluating, evaluation-unavailable | Resume evaluation, Choose another model | `EV-016`, `EV-017`, `EV-018`, `EV-020` |
| `challenge-result-history` | summary | Passed, needs revision or evaluation unavailable; Criterion evidence and gaps; Grading model used; Next learning action; Attempt and result history | passed, needs-revision, evaluation-unavailable | Revise and retry, Back to lesson | `EV-005`, `EV-016`, `EV-017`, `EV-018`, `EV-020` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Absent optional authored groups are omitted, never filled by repeated task copy. The learner owns model selection from the eligible catalog; AI evidence remains advisory and platform policy owns the final outcome.
