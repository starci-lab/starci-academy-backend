# Practice and assessment

> Business identity: `starci-academy/practice-assessment@de2b83bebdc7ba06ae11c6a09dc5d72b41645b7907fae2984b79a338e04efeeb`
>
> Source heads: authority `pending` · base `2df136cf2975aa81336d78711f848041be2bf421e0da2207c961d58c0b2ce345` · `fe@d9e352a60a61`, `be@88a395908477`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Learners choose coding domains and problems, submit code for asynchronous judging, launch guided playgrounds, and complete server-drawn mock interview sessions with results.

**Primary actor.** Learner

**Primary outcome.** The learner receives a judging job or a persisted mock interview session and result path

**Never does.** Embedded lesson challenge submissions

## Invariants

- `BR-01` — The coding hub distinguishes guest and signed-in access, independently settling domain mastery, resume work and ranking.
- `BR-02` — Coding submissions require authentication and return both submission and asynchronous job identities.
- `BR-03` — Mock interview session selection is performed on the server from course, level and kind and the session is persisted.

## Primary flow

```text
assessment-ready → assessment-pending → assessment-pending
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `practice-hub` | `/[lang]/practice{/[domain]}` | Choose a coding topic, resume work and inspect standing. | [surface](surfaces/practice-hub.md) |
| `coding-problem` | `/[lang]/practice/problem/[slug]` | Read a problem, edit code and submit it for judging. | [surface](surfaces/coding-problem.md) |
| `playground-catalog` | `/[lang]/courses/[displayId]/learn/playground` | Choose a guided live playground. | [surface](surfaces/playground-catalog.md) |
| `playground-session` | `/[lang]/courses/[displayId]/learn/playground/[slug]{/session}` | Prepare and run a guided live playground. | [surface](surfaces/playground-session.md) |
| `mock-interview-setup` | `/[lang]/courses/[displayId]/learn/mock-interview` | Choose interview parameters and start a session. | [surface](surfaces/mock-interview-setup.md) |
| `mock-interview-session` | `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]{/result}` | Complete interview turns and inspect the assessed result. | [surface](surfaces/mock-interview-session.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `submitCodingSolution` | backend | problem slug, language, source code | submission id, job id |
| `startMockInterviewSession` | backend | course, level, kind | persisted interview session |

## Explicit unknowns

- `playground-persistence` — Which playground session state is durable across devices? Impact: The routed surfaces prove setup and session entry, but the cited backend operations in this feature do not establish cross-device persistence semantics.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
