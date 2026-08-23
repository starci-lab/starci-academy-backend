# Agency showcase and lead capture

> Business head: `27c907d726bc0ed10628a94bf6a4f5631e2e033be7370b8c411bc13bd92f749f`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Vietnamese small-business buyers evaluate TEDO through a localized landing journey, compare services, indicative price ranges, delivery process and past projects, then start a consultation or submit a contact lead.

Included:
- Localized landing page sections
- Service, pricing, process and proof presentation
- Projects gallery with category filtering
- Low-friction consultation prompt
- Contact form forwarding to a configured delivery webhook

Excluded:
- Binding project quotation before discovery
- Back-office editing of marketing content

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/tedo-landingpage.git | `8c9f46e075dd18c99bd749237818ab4e2ebd4152` |

## 3. Actors and access

### Prospective buyer

- Review TEDO services and fit
- Compare indicative price ranges and timing
- Inspect project examples
- Start consultation
- Submit contact details

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

### TEDO platform

- Render the localized buyer journey
- Validate and forward contact leads

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

## 4. Entry points and surfaces

### TEDO agency landing

- ID: `agency-landing`
- Route: `/[locale]`
- Purpose: Answer a buyer's core trust, scope, budget, process and contact questions in one localized journey.
- Regions: `buyer-introduction`, `offer-evidence`, `contact-form`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-007`

### Projects

- ID: `projects-gallery`
- Route: `/[locale]/du-an`
- Purpose: Filter and inspect project cases before returning to contact.
- Regions: `project-proof`
- Navigation: none

Evidence: `EV-006`

## 5. Business flows

### Agency showcase and lead capture

Trigger: A prospective buyer opens the localized TEDO landing page.

1. **buyer** — Review proof, fit, services, pricing, process, aftercare, engagement, design, stack and FAQ → The buyer can judge whether TEDO matches the project
2. **buyer** — Open and filter the projects gallery → Relevant project evidence is displayed
3. **buyer** — Submit name, email and project message → The lead is forwarded to the configured webhook or an explicit error is returned

Outcomes:
- A qualified prospective buyer reaches consultation or a delivered contact lead

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

## 6. Business rules

### BR-01

The landing section order follows buyer questions: proof and fit precede services, price is exposed before detailed process, and contact closes the journey.

Strength: **confirmed** · Evidence: `EV-001`

### BR-02

Published prices are indicative ranges rather than a fixed quote; the exact figure is deferred to discovery.

Strength: **confirmed** · Evidence: `EV-004`

### BR-03

A contact lead requires name, email and message and fails explicitly when no delivery webhook is configured or the upstream rejects it.

Strength: **confirmed** · Evidence: `EV-007`, `EV-008`

## 7. State model

- **Showcase ready** (`showcase-ready`, initial) → lead-pending — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **Contact lead sending** (`lead-pending`, pending) → lead-sent, lead-error — `EV-007`, `EV-008`
- **Contact lead sent** (`lead-sent`, success) → terminal — `EV-007`, `EV-008`
- **Contact lead failed** (`lead-error`, error) → showcase-ready — `EV-007`, `EV-008`

## 8. Entities and data

- **Service offer**: title, body, included points — `EV-003`
- **Indicative price tier**: name, price range, time range, body, included points — `EV-004`
- **Project case**: title, category, highlights, stack, image — `EV-006`
- **Contact lead**: name, email, company, service, message, receivedAt — `EV-007`, `EV-008`

## 9. Operations and APIs

- **POST /api/contact** (command, frontend) — input: name, email, optional company, optional service, message; output: ok; failures: invalid fields, delivery webhook not configured, upstream delivery failed — `EV-008`

## 10. Acceptance conditions

- **AC-01** The localized home route renders the declared buyer journey and the projects route renders a filterable gallery. — `EV-001`, `EV-006`
- **AC-02** Valid contact leads are forwarded with receivedAt, while invalid, unconfigured and upstream failure states return explicit non-success responses. — `EV-008`

## 11. Explicit unknowns

- **What response-time commitment is guaranteed after a contact submission?** — The surfaces provide contact channels and success/failure handling but do not establish a service-level promise.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/[locale]/page.tsx:30` | route | The localized landing route composes hero, proof, fit, services, pricing, process, aftercare, engagement, design, stack, FAQ and contact in buyer-question order. |
| EV-002 | fe | `src/components/sections/hero.tsx:10` | ui | The hero presents localized value copy, a project lead prompt and a link to project proof. |
| EV-003 | fe | `src/components/sections/services.tsx:8` | ui | The services section renders titled offers with explanatory bodies and included points. |
| EV-004 | fe | `src/components/sections/pricing.tsx:10` | policy | The pricing section models tier name, range, time, body, inclusions and exclusions and explicitly defers exact pricing to discovery. |
| EV-005 | fe | `src/components/sections/process.tsx:7` | ui | The process section renders four delivery steps with title, body and indicative duration. |
| EV-006 | fe | `src/components/sections/projects-gallery.tsx:14` | ui | The projects surface filters project cases by category and renders highlights, technology stack and a contact CTA. |
| EV-007 | fe | `src/components/sections/contact.tsx:17` | ui | The contact section owns idle/sending/sent/error states, lead fields, calendar/email alternatives and submit action. |
| EV-008 | fe | `src/app/api/contact/route.ts:3` | api | The contact API validates name/email/message, fails when delivery is unconfigured, forwards timestamped leads and reports upstream failure. |
