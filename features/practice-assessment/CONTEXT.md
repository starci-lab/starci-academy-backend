# Practice and assessment

> Business identity: `starci-academy/practice-assessment@421904174c1d4e477c5b547cdc9b2c88ed1e6efa5c7a28652f2228f0ee853fa9`
>
> Source heads: authority `approved` · base `de60e36e9b67893bcbcd1a42d376b0921afd19ec7da23e72461b8c16dcc2bcd8` · `fe@f14e3c24b4a0`, `be@88a395908477`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Learners choose coding domains and problems, submit code for asynchronous judging, launch guided playgrounds, and follow a resumable course-scoped mock interview loop from preparation through evidence-based assessment and next practice.

**Primary actor.** Learner

**Primary outcome.** The learner repeatedly practises a course-scoped interview without losing confirmed work and converts evidence-based assessment into a next learning action.

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
- `BR-10` — Mock interview setup never presents generic journey progress; real progress requires a server-confirmed current position and total.
- `BR-11` — A learner has at most one resumable mock interview session per course, and Resume is primary on return.
- `BR-12` — Starting new requires explicit abandonment of the resumable session.
- `BR-13` — Format and target level are the only required choices and lock after session creation; course comes from Learn.
- `BR-14` — Submitted turns and server-confirmed position are recovery authority.
- `BR-15` — Interview mode exposes no between-turn scoring or coaching unless a separate coaching format declares it.
- `BR-16` — Completion passes through truthful submitting and grading states.
- `BR-17` — Assessment is answer- and rubric-linked, with recommendations inside the current course.
- `BR-18` — Only graded, sufficiently comparable attempts produce a progress trend.
- `BR-19` — Empty, delayed and failed states expose truthful recovery.

## Primary flow

```text
interview-no-session → interview-setup-ready → interview-creating → interview-active → interview-completion-submitting → interview-grading → interview-graded → next practice

interview-active → interview-paused-resumable → interview-active
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `practice-hub` | `/[lang]/practice{/[domain]}` | Choose a coding topic, resume work and inspect standing. | [surface](surfaces/practice-hub.md) |
| `coding-problem` | `/[lang]/practice/problem/[slug]` | Read a problem, edit code and submit it for judging. | [surface](surfaces/coding-problem.md) |
| `playground-catalog` | `/[lang]/courses/[displayId]/learn/playground` | Choose a guided live playground. | [surface](surfaces/playground-catalog.md) |
| `playground-setup` | `/[lang]/courses/[displayId]/learn/playground/[slug]` | Pair a machine, satisfy prerequisites and explicitly enter the guided session. | [surface](surfaces/playground-setup.md) |
| `playground-session` | `/[lang]/courses/[displayId]/learn/playground/[slug]/session` | Follow the guide and use the playground-kind workspace while preserving reconnect context. | [surface](surfaces/playground-session.md) |
| `mock-interview-setup` | `/[lang]/courses/[displayId]/learn/mock-interview` | Resume an unfinished interview, prepare a new one, or inspect prior development without fake setup progress. | [surface](surfaces/mock-interview-setup.md) |
| `mock-interview-session` | `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]` | Answer one prompt at a time with recoverable work and real session progress. | [surface](surfaces/mock-interview-session.md) |
| `mock-interview-result` | `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/result` | Wait for truthful assessment and choose the next course learning action. | [surface](surfaces/mock-interview-result.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `submitCodingSolution` | backend | problem slug, language, source code | submission id, job id |
| `startMockInterviewSession` | backend | course, level, kind | persisted interview session |
| `resumableMockInterviewSession` | backend | course | resumable session or none, server-confirmed position |
| `submitMockInterviewTurn` | backend | session id, turn identity, learner answer | confirmed turn, position, next prompt or completion |
| `abandonMockInterviewSession` | backend | session id, explicit confirmation | abandoned status |
| `completeMockInterviewSession` | backend | session id | grading status |
| `mockInterviewDevelopment` | backend | course, optional format and level | graded history, comparable progress or insufficient-data reason |

## Explicit unknowns

- `playground-persistence` — Which playground session state is durable across devices? Impact: The routed surfaces prove setup and session entry, but the cited backend operations in this feature do not establish cross-device persistence semantics.
- `interview-format-contract` — Which totals, durations and rubric versions belong to each format and level? Impact: architecture and backend contracts must assign their authority without inventing values in UI.
- `interview-comparability-threshold` — What minimum sample and dimensions permit a progress trend? Impact: progress remains insufficient-data until approved.

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
