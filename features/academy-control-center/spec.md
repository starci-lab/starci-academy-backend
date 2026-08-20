# Expert academy control center

> Business head: `1ee853b5fb1f388d076cdb02ae830116fae72fa2ce0fe14518d530f920a0866d`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

An authenticated expert-site owner manages an academy through growth and system modes spanning business metrics, students and course access, lead CRM, credentials, custom domain and provider integrations.

Included:
- Owner-scoped academy identity
- Growth metrics
- Student lifecycle and course access
- Lead follow-up
- Integration and credential management

Excluded:
- Public learner classroom behavior
- Displaying saved secret values after submission

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `97eec8c5bb4c8f4b9e4bb7c59ea771ed829841d9` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Authenticated academy owner

- Operate an owned academy's growth, students, leads and external integrations

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 4. Entry points and surfaces

### Expert academy

- ID: `academy-control-center`
- Route: `/[locale]/apps/[siteId]`
- Purpose: Operate the growth and system concerns of one exact owned academy.
- Regions: `academy-mode`, `growth-overview`, `students`, `lead-crm`, `integrations`
- Navigation: Expert academy (active)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 5. Business flows

### Expert academy control center

Trigger: Open an owned app

1. **account-actor** — Open an owned app → Choose Growth or System
2. **account-actor** — Choose Growth or System → Read the relevant owner-scoped domain block
3. **account-actor** — Read the relevant owner-scoped domain block → Perform an available student, lead or integration action
4. **account-actor** — Perform an available student, lead or integration action → The academy owner sees only the selected owned site

Outcomes:
- The academy owner sees only the selected owned site
- Secret values are accepted but not shown again

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 6. Business rules

### BR-01

The control center first resolves ownership of the exact site and refuses an absent or unowned academy.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

### BR-02

Domain blocks own their own requests and failures so one unavailable area does not erase the others.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 7. State model

- **restoring** (`restoring`, initial) → ready — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **ready** (`ready`, success) → refused — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **refused** (`refused`, error) → empty — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **empty** (`empty`, empty) → saving — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **saving** (`saving`, pending) → saved — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **saved** (`saved`, success) → action-failed — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **action-failed** (`action-failed`, error) → terminal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 8. Entities and data

- **Academy growth snapshot**: revenue, paid orders, students, completions, active rate — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **Academy student**: memberId, name, email, status, course progress — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **Expert site lead**: leadId, contact, status, note — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **Academy integrations**: domain, Google OAuth, SMTP, payments, Zalo, analytics, webhooks — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 9. Operations and APIs

- **myAcademyGrowthSnapshot** (query, backend) — input: siteId; output: academy growth snapshot; failures: not owned or unavailable — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **myAcademyStudents** (query, backend) — input: siteId, paging and filters; output: student page; failures: not owned or unavailable — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **createAcademyStudent** (mutation, backend) — input: siteId, name, email, optional password and role; output: created student; failures: validation or ownership refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **grantAcademyCourseAccess** (mutation, backend) — input: siteId, email, courseSlug; output: gifted course access; failures: course, student or ownership refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 10. Acceptance conditions

- **AC-01** The academy owner sees only the selected owned site — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **AC-02** The Expert academy control center surface renders only the states, identities and actions proven by current routed source. — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 11. Explicit unknowns

No unresolved question is recorded.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/app/src/components/pages/AcademyControlCenterPage/index.tsx:10` | ui | The connected page resolves the exact owned site and selects growth or system mode. |
| EV-002 | fe | `apps/app/src/components/pages/AcademyControlCenterPage/component.tsx:17` | ui | The surface defines restoring/refused/ready states and composes growth, students, leads and integration domain blocks. |
| EV-003 | fe | `apps/app/src/messages/en.json:214` | ui | Shipped copy names growth metrics, student and lead actions, integration providers, statuses and secret-handling outcomes. |
| EV-004 | be | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-growth-snapshot/my-academy-growth-snapshot.resolver.ts:31` | api | The growth query binds an authenticated user and exact site ID. |
| EV-005 | be | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/my-academy-students.resolver.ts:34` | api | The students query binds authenticated ownership to paging/filter input. |
| EV-006 | be | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/create-academy-student.resolver.ts:34` | api | The create-student mutation delegates the authenticated user and student input to the service. |
