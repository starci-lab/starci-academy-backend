# Practice and assessment

> Business head: `421904174c1d4e477c5b547cdc9b2c88ed1e6efa5c7a28652f2228f0ee853fa9`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Learners choose coding domains and problems, submit code for asynchronous judging, launch guided playgrounds, and follow a resumable course-scoped mock interview loop from preparation through evidence-based assessment and next practice.

Included:
- Coding practice hub, domain and problem routes
- Asynchronous coding submissions
- Course playground catalog, setup and session
- Course-scoped mock interview overview, setup, resumable session, assessment, result, history and progress

Excluded:
- Embedded lesson challenge submissions
- Personal project milestone review

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `f14e3c24b4a087fb6d4bb09d73526964d3ecea3c` |
| be | https://github.com/starci-lab/starci-academy-backend | `88a3959084772f9eaa0f5dcbc4e480d4356210f0` |

## 3. Actors and access

### Learner

- Choose a coding domain
- Solve and submit coding problems
- Run course playground sessions
- Prepare, resume and complete mock interviews
- Use answer-linked assessment to choose the next course learning action

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`, `EV-014`, `EV-015`

### StarCi Academy platform

- Queue coding solutions for judging
- Draw and persist mock interview sessions
- Restore confirmed interview progress and produce answer-linked assessment

Evidence: `EV-009`, `EV-010`, `EV-015`

## 4. Entry points and surfaces

### Coding practice

- ID: `practice-hub`
- Route: `/[lang]/practice{/[domain]}`
- Purpose: Choose a coding topic, resume work and inspect standing.
- Regions: `practice-choice`
- Navigation: none

Evidence: `EV-001`, `EV-002`

### Coding problem

- ID: `coding-problem`
- Route: `/[lang]/practice/problem/[slug]`
- Purpose: Read a problem, edit code and submit it for judging.
- Regions: `problem-workspace`
- Navigation: none

Evidence: `EV-003`

### Course playgrounds

- ID: `playground-catalog`
- Route: `/[lang]/courses/[displayId]/learn/playground`
- Purpose: Choose a guided live playground.
- Regions: `playground-list`
- Navigation: none

Evidence: `EV-004`

### Prepare Playground

- ID: `playground-setup`
- Route: `/[lang]/courses/[displayId]/learn/playground/[slug]`
- Purpose: Pair a machine, satisfy prerequisites and explicitly enter the guided session.
- Regions: `playground-readiness`
- Navigation: `playground-catalog`

Evidence: `EV-014`

### Live Playground session

- ID: `playground-session`
- Route: `/[lang]/courses/[displayId]/learn/playground/[slug]/session`
- Purpose: Follow the guide and use the playground-kind workspace while preserving reconnect context.
- Regions: `playground-workspace`
- Navigation: `playground-setup`

Evidence: `EV-005`, `EV-014`

### Mock interview

- ID: `mock-interview-setup`
- Route: `/[lang]/courses/[displayId]/learn/mock-interview`
- Purpose: Resume an unfinished course interview, prepare a new one, or inspect prior development without presenting fake setup progress.
- Regions: `interview-entry`, `interview-setup`, `interview-development`
- Navigation: none

Evidence: `EV-006`, `EV-010`, `EV-015`

### Interview session

- ID: `mock-interview-session`
- Route: `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]`
- Purpose: Answer one prompt at a time while preserving submitted turns and exposing only real session progress.
- Regions: `interview-run`
- Navigation: `mock-interview-setup`

Evidence: `EV-007`, `EV-010`, `EV-015`

### Interview result

- ID: `mock-interview-result`
- Route: `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/result`
- Purpose: Wait for truthful assessment, understand answer-linked performance and choose the next course learning action.
- Regions: `interview-assessment`
- Navigation: `mock-interview-setup`, `mock-interview-session`

Evidence: `EV-008`, `EV-015`

## 5. Business flows

### Practice and assessment

Trigger: A learner opens practice or a course assessment route.

1. **learner** — Choose a coding domain, playground or mock interview → The selected setup surface opens
2. **learner** — Submit source code for a problem → A submission and judging job are returned
3. **learner** — Resume an unfinished interview or prepare a course-scoped format and target level → The learner enters a recoverable session and a path through assessment to the next learning action

Outcomes:
- The learner receives a judging job, a guided Playground, or a recoverable mock interview practice loop

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`, `EV-015`

### Practise through a resumable mock interview loop

Trigger: A learner opens the mock interview route for a course.

1. **learner** — Open the course mock interview home → Resume, prepare new, or inspect prior development
2. **learner** — Resume or choose format and target level → A resumable session opens or the format contract is explained
3. **learner** — Start the configured interview → The server persists a session with a declared phase or turn total
4. **learner** — Submit each answer → Confirmed turns and position remain recoverable
5. **platform** — Assess the completed interview → Truthful submitting, grading, delayed or failed status is shown
6. **learner** — Inspect answer-linked strengths, gaps and recommendations → A next learning action is chosen
7. **learner** — Review graded history and comparable progress → Attempt details or an insufficient-data explanation is shown

Outcomes:
- The learner repeatedly practises without losing confirmed work and converts evidence-based assessment into a next course learning action

Evidence: `EV-006`, `EV-007`, `EV-008`, `EV-010`, `EV-013`, `EV-015`

### Complete a guided Playground

Trigger: A learner opens the Playground catalog for a course.

1. **learner** — Choose a guided Playground → The selected Playground setup opens
2. **learner** — Pair a machine and satisfy every declared readiness check → The setup becomes ready for explicit entry
3. **learner** — Enter the prepared Playground → The guided live workspace opens without discarding setup context
4. **learner** — Follow the guide and use the playground-kind workspace → The learner completes or safely reconnects to the live session

Outcomes:
- The learner moves from discovery through explicit readiness into a guided live Playground session

Evidence: `EV-004`, `EV-005`, `EV-014`

## 6. Business rules

### BR-01

The coding hub distinguishes guest and signed-in access, independently settling domain mastery, resume work and ranking.

Strength: **confirmed** · Evidence: `EV-002`

### BR-02

Coding submissions require authentication and return both submission and asynchronous job identities.

Strength: **confirmed** · Evidence: `EV-009`

### BR-03

Mock interview session selection is performed on the server from course, level and kind and the session is persisted.

Strength: **confirmed** · Evidence: `EV-010`

### BR-04

Playground selection opens a distinct setup surface before the live session.

Strength: **confirmed** · Evidence: `EV-014`

### BR-05

Entering a Playground requires every declared readiness check and remains an explicit learner action.

Strength: **confirmed** · Evidence: `EV-014`

### BR-06

Reloading setup resumes an available open session before creating a replacement session.

Strength: **confirmed** · Evidence: `EV-014`

### BR-07

A live-session deep link without a prior successful machine pair returns the learner to setup.

Strength: **confirmed** · Evidence: `EV-014`

### BR-08

A connection drop after a successful pair keeps the learner in the live session and exposes reconnect guidance.

Strength: **confirmed** · Evidence: `EV-014`

### BR-09

The live workspace anatomy follows the Playground kind while preserving one shared guided-session shell.

Strength: **confirmed** · Evidence: `EV-014`

### BR-10

Mock interview setup never presents generic journey progress; real progress requires a server-confirmed current position and total.

Strength: **confirmed** · Evidence: `EV-015`

### BR-11

A learner has at most one resumable mock interview session per course, and Resume is primary on return.

Strength: **confirmed** · Evidence: `EV-015`

### BR-12

Starting new requires explicit abandonment of the resumable session and never silently discards confirmed work.

Strength: **confirmed** · Evidence: `EV-015`

### BR-13

Format and target level are the only required setup choices and lock after creation; course is inherited from Learn.

Strength: **confirmed** · Evidence: `EV-015`

### BR-14

Submitted turns and server-confirmed position are recovery authority across refresh, reconnect and leaving Learn.

Strength: **confirmed** · Evidence: `EV-015`

### BR-15

Interview mode exposes no between-turn score or coaching unless a separately declared coaching format is selected.

Strength: **confirmed** · Evidence: `EV-015`

### BR-16

Completion passes through truthful submitting and grading states; delayed or failed grading never appears complete.

Strength: **confirmed** · Evidence: `EV-015`

### BR-17

Assessment is traceable to submitted answers and the declared rubric, with recommendations inside the current course.

Strength: **confirmed** · Evidence: `EV-015`

### BR-18

Only graded, sufficiently comparable attempts produce a progress trend; otherwise an insufficient-data explanation is shown.

Strength: **confirmed** · Evidence: `EV-015`

### BR-19

Every empty, delayed and failed mock interview state exposes a truthful recovery action.

Strength: **confirmed** · Evidence: `EV-015`

## 7. State model

- **Assessment ready** (`assessment-ready`, initial) → assessment-pending, assessment-error — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-006`
- **Assessment pending** (`assessment-pending`, pending) → assessment-complete, assessment-error — `EV-009`, `EV-010`
- **Assessment complete** (`assessment-complete`, success) → terminal — `EV-008`, `EV-009`, `EV-010`
- **Assessment failed** (`assessment-error`, error) → assessment-ready — `EV-002`, `EV-009`, `EV-010`
- **Playground catalog ready** (`playground-catalog-ready`, initial) → playground-setup-pending — `EV-004`, `EV-014`
- **Playground setup pending** (`playground-setup-pending`, pending) → playground-setup-ready, playground-setup-error — `EV-014`
- **Playground setup ready** (`playground-setup-ready`, success) → playground-session-active — `EV-014`
- **Playground setup failed** (`playground-setup-error`, error) → playground-setup-pending — `EV-014`
- **Playground session active** (`playground-session-active`, success) → playground-session-reconnecting, playground-session-complete, playground-session-error — `EV-005`, `EV-014`
- **Playground session reconnecting** (`playground-session-reconnecting`, pending) → playground-session-active, playground-session-error — `EV-014`
- **Playground session complete** (`playground-session-complete`, success) → terminal — `EV-014`
- **Playground session failed** (`playground-session-error`, error) → playground-session-reconnecting — `EV-014`
- **No interview in progress** (`interview-no-session`, initial) → interview-setup-ready — `EV-015`
- **Interview setup ready** (`interview-setup-ready`, initial) → interview-creating, interview-active, interview-start-error — `EV-006`, `EV-010`, `EV-015`
- **Creating interview** (`interview-creating`, pending) → interview-active, interview-start-error — `EV-010`, `EV-015`
- **Interview active** (`interview-active`, success) → interview-saving-turn, interview-paused-resumable, interview-reconnecting, interview-completion-submitting, interview-abandoned — `EV-007`, `EV-010`, `EV-015`
- **Saving answer** (`interview-saving-turn`, pending) → interview-active, interview-completion-submitting, interview-save-error — `EV-015`
- **Ready to resume** (`interview-paused-resumable`, pending) → interview-active, interview-abandoned — `EV-015`
- **Reconnecting** (`interview-reconnecting`, pending) → interview-active, interview-save-error — `EV-015`
- **Submitting completion** (`interview-completion-submitting`, pending) → interview-grading, interview-save-error — `EV-015`
- **Assessment in progress** (`interview-grading`, pending) → interview-graded, interview-grading-delayed, interview-grading-error — `EV-008`, `EV-015`
- **Interview assessed** (`interview-graded`, success) → interview-setup-ready — `EV-008`, `EV-015`
- **Start failed** (`interview-start-error`, error) → interview-setup-ready — `EV-010`, `EV-015`
- **Save failed** (`interview-save-error`, error) → interview-active, interview-paused-resumable — `EV-015`
- **Assessment delayed** (`interview-grading-delayed`, pending) → interview-grading, interview-graded, interview-grading-error — `EV-015`
- **Assessment failed** (`interview-grading-error`, error) → interview-grading — `EV-015`
- **Interview abandoned** (`interview-abandoned`, error) → interview-setup-ready — `EV-015`

## 8. Entities and data

- **Coding problem**: slug, domain, statement, language, source code, test cases — `EV-003`, `EV-009`
- **Coding submission**: submission id, job id, verdict — `EV-009`
- **Mock interview session**: course, level, kind, session id, turns, current position, format total, status, last confirmed time, rubric, result, recommendations — `EV-006`, `EV-007`, `EV-008`, `EV-010`, `EV-015`

## 9. Operations and APIs

- **submitCodingSolution** (mutation, backend) — input: problem slug, language, source code; output: submission id, job id; failures: authentication rejected, problem or language rejected, judge queue failed — `EV-009`
- **startMockInterviewSession** (mutation, backend) — input: course, level, kind; output: persisted interview session; failures: authentication rejected, selection unavailable, session creation failed — `EV-010`
- **resumableMockInterviewSession** (query, backend) — input: course; output: resumable session or none, server-confirmed position — `EV-015`
- **submitMockInterviewTurn** (mutation, backend) — input: session id, turn identity, answer; output: confirmed turn, position, next prompt or completion — `EV-015`
- **abandonMockInterviewSession** (mutation, backend) — input: session id, explicit confirmation; output: abandoned status — `EV-015`
- **completeMockInterviewSession** (mutation, backend) — input: session id; output: grading status — `EV-015`
- **mockInterviewDevelopment** (query, backend) — input: course, optional format and level; output: graded history and comparable progress or insufficient-data reason — `EV-015`

## 10. Acceptance conditions

- **AC-01** Practice, coding problem, playground and mock interview route families mount their declared surfaces. — `EV-001`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`
- **AC-02** Submitting code returns submission and job identities for asynchronous judging. — `EV-009`
- **AC-03** Starting a mock interview server-draws and persists a session for the chosen course, level and kind. — `EV-010`
- **AC-04** A first-time learner understands format, expected effort and assessment output before starting, without decorative setup progress. — `EV-006`, `EV-015`
- **AC-05** The Playground journey exposes catalog, explicit readiness setup and a guarded live session as distinct surfaces with reconnect behavior. — `EV-004`, `EV-005`, `EV-014`
- **AC-06** An unfinished interview makes Resume primary and starting new requires explicit abandonment. — `EV-015`
- **AC-07** Active progress uses only server-confirmed current position and format total. — `EV-007`, `EV-015`
- **AC-08** Refresh, reconnect and leaving Learn preserve confirmed work. — `EV-015`
- **AC-09** Completion passes through submitting and grading before result. — `EV-008`, `EV-015`
- **AC-10** Delayed or failed assessment has truthful recovery. — `EV-015`
- **AC-11** Result connects answer evidence, gaps, course content and next practice. — `EV-008`, `EV-015`
- **AC-12** History distinguishes no data, insufficient data and supported trend. — `EV-015`
- **AC-13** Concurrent or stale advancement cannot overwrite confirmed position. — `EV-015`

## 11. Explicit unknowns

- **Which playground session state is durable across devices?** — The routed surfaces prove setup and session entry, but the cited backend operations in this feature do not establish cross-device persistence semantics.
- **What phase or turn totals, durations and rubric versions belong to each format and level?** — Architecture and backend contracts must assign their authority without inventing values in UI.
- **What minimum sample and dimensions permit a progress trend?** — Progress remains insufficient-data until an approved comparison rule exists.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/[lang]/practice/page.tsx:1` | route | The practice route mounts CodingPracticeHubPage. |
| EV-002 | fe | `src/components/pages/CodingPracticeHubPage/component.tsx:40` | ui | The coding hub exposes guest/signed-in access, domain mastery, resume work and ranked standing. |
| EV-003 | fe | `src/app/[lang]/practice/problem/[slug]/page.tsx:1` | route | The problem route mounts CodingProblemPage for a slug. |
| EV-004 | fe | `src/app/[lang]/courses/[displayId]/learn/playground/page.tsx:1` | route | The course playground route mounts the playground catalog. |
| EV-005 | fe | `src/app/[lang]/courses/[displayId]/learn/playground/[slug]/session/page.tsx:1` | route | The playground session route mounts the live session page. |
| EV-006 | fe | `src/app/[lang]/courses/[displayId]/learn/mock-interview/page.tsx:1` | route | The mock interview route mounts the setup page. |
| EV-007 | fe | `src/app/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/page.tsx:1` | route | The interview session route mounts the active session page. |
| EV-008 | fe | `src/app/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/result/page.tsx:1` | route | The interview result route mounts the result page. |
| EV-009 | be | `src/features/api/core/graphql/mutations/coding/submit-coding-solution/submit-coding-solution.resolver.ts:70` | api | The authenticated submitCodingSolution mutation accepts problem slug, language and source and returns submission plus job ids. |
| EV-010 | be | `src/features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session.resolver.ts:70` | api | The guarded startMockInterviewSession mutation server-draws and persists a course, level and kind session. |
| EV-011 | owner | `decision:2e6794d9a35c5acc029dee9eafc2978fa91dd9589da5f8ce3f6111cbfb465275` | owner-decision | The owner authorized refreshing study-library and practice-assessment to current routed source heads before continuing the four-layout design set. |
| EV-012 | owner | `decision:fee04602de7b3f4deab3147add8577d5ce22603c29b5b152f1266c45c10b1e9f` | owner-decision | Owner approved reconciling practice-assessment to the current routed FE and BE commits before executing the accepted mock interview flow. |
| EV-013 | owner | `decision:535bba7789be754d510d300f488aa1354fc17c340ba65b3d1be26a4740b738dc` | owner-decision | Owner approved redesigning the complete mock interview frontend journey across setup, persisted interview turns and assessed result without changing the backend contract. |
| EV-014 | owner | `decision:b7bd88ae324073831db451f22f4ccd749f3bbb67ac2f4dd130b583fd55b28257` | owner-decision | Owner approved redesigning the complete Playground frontend journey across catalog, explicit readiness setup and guarded live session, using legacy behavior as reference while keeping cross-device persistence unknown. |
| EV-015 | owner | `decision:4626c06604e3d87962f37593bdd905d9683769dd0cf02c789dfc27f9690f0bb3` | owner-decision | Owner approved replacing meaningless setup progress with a complete course-scoped, resumable mock interview practice loop. |
