# Study library

> Business head: `1f134aaa1d014eb977ca8f8d974e3d7002a01d1a115931f0b7a180b4c8c2c84b`
>
> Generated projection of the immutable model. Update through the routed business-authority workflow.

## Overview

A course-level flashcard hub leads learners into either spaced-repetition Study or a configurable Quick quiz, preserves unfinished work, and closes each run with actionable results. Foundations and Mind map retain their existing behavior.

## Actors

- **Learner** — chooses a mode, starts or resumes work, completes cards, inspects results and follows recommended study.
- **Platform** — exposes readiness, persists and restores sessions, records acknowledged progress, and returns result evidence.

## Surfaces

| Surface | Route | Purpose |
|---|---|---|
| `flashcard-library` | `/[lang]/courses/[displayId]/learn/flashcards/{review|quiz}` | Readiness, mode choice, Study overview and Quick quiz Begin/History/Stats. |
| `study-session` | `.../review/sessions/[sessionId]` | Focused reveal-and-rate spaced-repetition work. |
| `study-result` | `.../review/sessions/[sessionId]/result` | Recall evidence, next due, weak topics and next action. |
| `quick-quiz-session` | `.../quiz/sessions/[sessionId]` | Focused timed answer, check and solution work. |
| `quick-quiz-result` | `.../quiz/sessions/[sessionId]/result` | Coverage, XP, outcomes, weak topics and next action. |
| `foundation-library` | `/[lang]/courses/[displayId]/learn/foundations{/...}` | Existing foundation browsing. |
| `course-mind-map` | `/[lang]/courses/[displayId]/learn/mind-map` | Existing course concept map. |

## Flows

### Flashcard entry

Read readiness → choose Study or Quick quiz → enter setup or resume acknowledged work.

### Study

Choose due queue or deck → choose all or due cards → persist → reveal and rate → save/leave/resume or finish early → dedicated result → recommended study or return.

### Quick quiz

Open Begin/History/Stats → configure within existing capability → persist timed run → answer/check/reveal → save/leave/resume, expire or finish early → dedicated result → retry, recommended study or return.

### Reference tools

Foundations and Mind map remain available outside the flashcard visual redesign.

## Contract invariants

- Persist before focused navigation.
- Restore exact acknowledged progress.
- Live and result routes have distinct meaning.
- Invalid or expired identities recover safely.
- Existing backend inputs, scoring, scheduling, access gates and route semantics remain unchanged.
- Legacy evidence informs journey completeness only.

## States

Hub: ready, empty, error. Study: configuring, starting, active, saving, invalid, result. Quick quiz: configuring, starting, active, saving, invalid or expired, result. Every remote surface includes pending, ready, empty or failed behavior as applicable.

## Acceptance

1. Study and Quick quiz are explicit and route-addressable.
2. Study supports due/deck, all/due, persisted resume, reveal, four ratings and dedicated results.
3. Quick quiz supports Begin/History/Stats, persisted timed resume, answer check, solution reveal and dedicated results.
4. Both branches preserve acknowledged work on safe exit and confirm finish early.
5. Result screens expose branch-specific evidence, weak topics and next-study actions.
6. All remote and session recovery states are designed.
7. No current contract semantics change.
8. Foundations and Mind map remain outside the flashcard redesign.

## Evidence

Current routed source evidence remains `EV-001`–`EV-007`; owner approvals are `EV-008`–`EV-010`. Legacy manifest `EV-011` is reference-only.
