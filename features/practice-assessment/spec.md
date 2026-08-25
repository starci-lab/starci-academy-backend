# Practice and assessment

> Business head: `b7bd88ae324073831db451f22f4ccd749f3bbb67ac2f4dd130b583fd55b28257`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Learners choose coding domains and problems, submit code for asynchronous judging, launch guided playgrounds, and complete server-drawn mock interview sessions with results.

Included:
- Coding practice hub, domain and problem routes
- Asynchronous coding submissions
- Course playground catalog, setup and session
- Mock interview setup, session and result

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
- Start and complete mock interviews

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`, `EV-014`

### StarCi Academy platform

- Queue coding solutions for judging
- Draw and persist mock interview sessions

Evidence: `EV-009`, `EV-010`

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
- Purpose: Choose interview parameters and start a session.
- Regions: `interview-setup`
- Navigation: none

Evidence: `EV-006`

### Interview session

- ID: `mock-interview-session`
- Route: `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]`
- Purpose: Complete the persisted interview turns.
- Regions: `interview-run`
- Navigation: none

Evidence: `EV-007`

### Interview result

- ID: `mock-interview-result`
- Route: `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/result`
- Purpose: Inspect the assessed result after completing the interview.
- Regions: `interview-assessment`
- Navigation: none

Evidence: `EV-008`

## 5. Business flows

### Practice and assessment

Trigger: A learner opens practice or a course assessment route.

1. **learner** — Choose a coding domain, playground or mock interview → The selected setup surface opens
2. **learner** — Submit source code for a problem → A submission and judging job are returned
3. **learner** — Choose course, level and interview kind → The server draws and persists an interview session

Outcomes:
- The learner receives a judging job or a persisted mock interview session and result path

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`

### Complete a mock interview

Trigger: A learner opens the mock interview route for a course.

1. **learner** — Choose the interview level and kind → The setup is ready to start
2. **learner** — Start the interview → The server draws and persists the interview session
3. **learner** — Complete the interview turns → The session reaches an assessed outcome
4. **learner** — Inspect the assessed result → The learner sees the completed interview assessment

Outcomes:
- The learner completes a persisted mock interview journey from setup through assessed result

Evidence: `EV-006`, `EV-007`, `EV-008`, `EV-010`, `EV-013`

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

## 8. Entities and data

- **Coding problem**: slug, domain, statement, language, source code, test cases — `EV-003`, `EV-009`
- **Coding submission**: submission id, job id, verdict — `EV-009`
- **Mock interview session**: course, level, kind, session id, turns, result — `EV-006`, `EV-007`, `EV-008`, `EV-010`

## 9. Operations and APIs

- **submitCodingSolution** (mutation, backend) — input: problem slug, language, source code; output: submission id, job id; failures: authentication rejected, problem or language rejected, judge queue failed — `EV-009`
- **startMockInterviewSession** (mutation, backend) — input: course, level, kind; output: persisted interview session; failures: authentication rejected, selection unavailable, session creation failed — `EV-010`

## 10. Acceptance conditions

- **AC-01** Practice, coding problem, playground and mock interview route families mount their declared surfaces. — `EV-001`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`
- **AC-02** Submitting code returns submission and job identities for asynchronous judging. — `EV-009`
- **AC-03** Starting a mock interview server-draws and persists a session for the chosen course, level and kind. — `EV-010`
- **AC-04** The mock interview journey exposes setup, persisted session turns and an assessed result as distinct surfaces. — `EV-006`, `EV-007`, `EV-008`, `EV-010`
- **AC-05** The Playground journey exposes catalog, explicit readiness setup and a guarded live session as distinct surfaces with reconnect behavior. — `EV-004`, `EV-005`, `EV-014`

## 11. Explicit unknowns

- **Which playground session state is durable across devices?** — The routed surfaces prove setup and session entry, but the cited backend operations in this feature do not establish cross-device persistence semantics.

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
