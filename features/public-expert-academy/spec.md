# Public expert academy

> Business head: `866a162d6dc8de3a31751be89172b05073cf5a5d5c32225a6f1eb16f7fbb8fb6`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

A public academy landing page renders expert-authored sections in their configured order, combines them with a public course catalogue, and accepts a visitor contact lead without requiring an account.

Included:
- Expert-authored landing sections
- Public course catalogue
- Public lead capture
- Empty catalogue and submit feedback

Excluded:
- Authenticated classroom and course consumption
- Owner control-center operations

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `97eec8c5bb4c8f4b9e4bb7c59ea771ed829841d9` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Academy visitor

- Learn about an academy, browse offered courses and submit contact details

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 4. Entry points and surfaces

### Expert academy

- ID: `public-academy`
- Route: `/[locale]`
- Purpose: Turn an expert's configured story and course catalogue into a public discovery and lead-capture page.
- Regions: `academy-story`, `course-catalogue`, `lead-form`
- Navigation: Expert academy (active)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 5. Business flows

### Public expert academy

Trigger: Open the public academy

1. **account-actor** — Open the public academy → Read authored and system sections
2. **account-actor** — Read authored and system sections → Browse courses
3. **account-actor** — Browse courses → Submit name and contact in the lead section
4. **account-actor** — Submit name and contact in the lead section → The public catalogue remains browsable without an account

Outcomes:
- The public catalogue remains browsable without an account
- An accepted or refused lead submission is shown in the lead section

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 6. Business rules

### BR-01

Authored visible sections render in the expert's configured order; empty list-backed sections are omitted where the connected layer decides they have nothing to say.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

### BR-02

The lead section is the only public section allowed to collect visitor data.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 7. State model

- **catalog-ready** (`catalog-ready`, initial) → catalog-empty — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **catalog-empty** (`catalog-empty`, empty) → lead-idle — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **lead-idle** (`lead-idle`, pending) → lead-sending — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **lead-sending** (`lead-sending`, pending) → lead-sent — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **lead-sent** (`lead-sent`, success) → lead-failed — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **lead-failed** (`lead-failed`, error) → terminal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 8. Entities and data

- **Public course**: id, slug, title, summary, priceText, sortIndex — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **Lead submission**: name, contact, optional message — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 9. Operations and APIs

- **courses** (query, backend) — input: none; output: public ordered course catalogue; failures: empty catalogue fallback — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **submitLead** (mutation, backend) — input: name, contact, optional message; output: lead ID; failures: validation or transport refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 10. Acceptance conditions

- **AC-01** The public catalogue remains browsable without an account — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **AC-02** The Public expert academy surface renders only the states, identities and actions proven by current routed source. — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 11. Explicit unknowns

- **What authenticated learner journey should the current Try free action enter?** — The public surface links toward sign-in, but this feature does not contain an implemented classroom journey.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/expert/src/modules/api/academy.ts:3` | contract | The public academy reads a six-field course catalogue and submits name/contact leads without a token. |
| EV-002 | fe | `apps/expert/src/components/blocks/academy/AcademySections/index.tsx:21` | ui | The connected sections layer resolves visible authored and system sections and drops empty list-backed sections before drawing. |
| EV-003 | fe | `apps/expert/src/components/blocks/academy/AcademySections/component.tsx:323` | ui | The lead band is the only section that accepts visitor data and exposes idle/sending/sent/failed feedback. |
| EV-004 | fe | `apps/expert/src/components/blocks/academy/AcademySections/component.interaction.spec.tsx:26` | test | Interaction tests prove authored section ordering and lead submission with name and contact. |
| EV-005 | be | `src/features/expert/graphql/queries/classroom/courses/courses.resolver.ts:43` | api | The expert API exposes the course catalogue publicly. |
| EV-006 | be | `src/features/expert/graphql/mutations/leads/submit-lead/submit-lead.resolver.ts:29` | api | The expert API exposes public lead submission. |
