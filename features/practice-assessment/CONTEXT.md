# Practice and assessment

> Business identity: `starci-academy/practice-assessment@b7bd88ae324073831db451f22f4ccd749f3bbb67ac2f4dd130b583fd55b28257`
>
> Source heads: authority `approved` · base `b7bd88ae324073831db451f22f4ccd749f3bbb67ac2f4dd130b583fd55b28257` · `fe@f14e3c24b4a0`, `be@88a395908477`
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
- `BR-04` — Playground selection opens a distinct setup surface before the live session.
- `BR-05` — Entering a Playground requires every declared readiness check and remains an explicit learner action.
- `BR-06` — Reloading setup resumes an available open session before creating a replacement session.
- `BR-07` — A live-session deep link without a prior successful machine pair returns the learner to setup.
- `BR-08` — A connection drop after a successful pair keeps the learner in the live session and exposes reconnect guidance.
- `BR-09` — The live workspace anatomy follows the Playground kind while preserving one shared guided-session shell.

## Primary flow

```text
playground-catalog-ready → playground-setup-pending → playground-setup-ready → playground-session-active → playground-session-complete
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `practice-hub` | `/[lang]/practice{/[domain]}` | Choose a coding topic, resume work and inspect standing. | [surface](surfaces/practice-hub.md) |
| `coding-problem` | `/[lang]/practice/problem/[slug]` | Read a problem, edit code and submit it for judging. | [surface](surfaces/coding-problem.md) |
| `playground-catalog` | `/[lang]/courses/[displayId]/learn/playground` | Choose a guided live playground. | [surface](surfaces/playground-catalog.md) |
| `playground-setup` | `/[lang]/courses/[displayId]/learn/playground/[slug]` | Pair a machine, satisfy prerequisites and explicitly enter the guided session. | [surface](surfaces/playground-setup.md) |
| `playground-session` | `/[lang]/courses/[displayId]/learn/playground/[slug]/session` | Follow the guide and use the playground-kind workspace while preserving reconnect context. | [surface](surfaces/playground-session.md) |
| `mock-interview-setup` | `/[lang]/courses/[displayId]/learn/mock-interview` | Choose interview parameters and start a session. | [surface](surfaces/mock-interview-setup.md) |
| `mock-interview-session` | `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]` | Complete the persisted interview turns. | [surface](surfaces/mock-interview-session.md) |
| `mock-interview-result` | `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/result` | Inspect the assessed result after completing the interview. | [surface](surfaces/mock-interview-result.md) |

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
