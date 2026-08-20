# Course marketplace and checkout

> Business head: `e1891d1154316864680bf370dccf92acc293fdfa68a6d8f78e1b7c958b1e5102`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Visitors discover localized courses, inspect curriculum and pricing evidence, collect courses in a personal cart, and start one authenticated checkout for the selected course set.

Included:
- Course catalog search, view and pagination
- Course detail overview, curriculum, reviews, FAQ and pricing rail
- Personal cart lines, totals, empty/error handling and checkout

Excluded:
- Payment-provider webhook settlement after checkout leaves the application
- Administrative course authoring

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `84bf3be6565a20b1fee9c83cab8b9ba810d13e11` |
| be | https://github.com/starci-lab/starci-academy-backend | `eca4e018044f38900441790974c329c9cd4f3400` |

## 3. Actors and access

### Learner

- Browse and search courses
- Inspect a course
- Manage a personal cart
- Start checkout

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

### StarCi Academy platform

- Return catalog and detail data
- Price a cart
- Create an order with one line per course

Evidence: `EV-007`

## 4. Entry points and surfaces

### Course catalog

- ID: `course-catalog`
- Route: `/[lang]/courses`
- Purpose: Find and compare courses.
- Regions: `catalog-results`
- Navigation: none

Evidence: `EV-001`, `EV-004`

### Course detail

- ID: `course-detail`
- Route: `/[lang]/courses/[displayId]`
- Purpose: Evaluate a course before enrollment.
- Regions: `course-decision`
- Navigation: none

Evidence: `EV-002`, `EV-005`

### Shopping cart

- ID: `shopping-cart`
- Route: `/[lang]/cart`
- Purpose: Review selected courses and totals before checkout.
- Regions: `cart-lines-and-summary`
- Navigation: none

Evidence: `EV-003`, `EV-006`

## 5. Business flows

### Course marketplace and checkout

Trigger: A visitor opens the course catalog.

1. **learner** — Search, page or change the catalog view → A course set is displayed
2. **learner** — Open a course and review its curriculum, prerequisites, reviews, FAQ and offer → The course decision surface is displayed
3. **learner** — Proceed with the selected cart lines → The backend starts one checkout order for the selected courses

Outcomes:
- The learner receives a checkout result for the selected course set

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 6. Business rules

### BR-01

The catalog distinguishes pending, empty, filtered-empty, failed and populated states, and supports search, view and pagination controls.

Strength: **confirmed** · Evidence: `EV-004`

### BR-02

The cart is viewer-owned, hides totals and checkout actions when empty or unreadable, and requires confirmation before clearing all lines.

Strength: **confirmed** · Evidence: `EV-003`, `EV-006`

### BR-03

Checkout requires authentication and creates one order with one line per submitted course.

Strength: **confirmed** · Evidence: `EV-007`

## 7. State model

- **Marketplace ready** (`marketplace-ready`, initial) → checkout-pending — `EV-001`, `EV-002`, `EV-004`, `EV-005`
- **Checkout pending** (`checkout-pending`, pending) → checkout-started, marketplace-error — `EV-006`, `EV-007`
- **Checkout started** (`checkout-started`, success) → terminal — `EV-007`
- **Marketplace or checkout failed** (`marketplace-error`, error) → marketplace-ready — `EV-004`, `EV-005`, `EV-006`

## 8. Entities and data

- **Course**: displayId, title, tagline, modules, prerequisites, reviews, offer — `EV-002`, `EV-005`
- **Cart**: course lines, subtotal, savings, total — `EV-003`, `EV-006`
- **Checkout request**: course ids, payment type, redirect URLs — `EV-007`

## 9. Operations and APIs

- **coursesCheckout** (mutation, backend) — input: course ids, payment type, redirect URLs; output: order and provider checkout data; failures: authentication rejected, pricing rejected, checkout provider failed — `EV-007`

## 10. Acceptance conditions

- **AC-01** Catalog, course detail and cart routes mount their corresponding page surfaces with the declared settled states. — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **AC-02** Authenticated checkout accepts course ids, payment type and redirect URLs and starts one order containing a line for each course. — `EV-007`

## 11. Explicit unknowns

- **Which payment-provider result fields should a prototype expose after coursesCheckout?** — The resolver confirms checkout ownership and inputs, but provider-specific return UI is not established by the cited marketplace surfaces.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/[lang]/courses/page.tsx:24` | route | The localized public catalog publishes metadata and mounts CoursesCatalogPage. |
| EV-002 | fe | `src/app/[lang]/courses/[displayId]/page.tsx:24` | route | The dynamic course route mounts CourseDetailPage for displayId. |
| EV-003 | fe | `src/app/[lang]/cart/page.tsx:1` | route | The force-dynamic viewer-owned cart route mounts CartPage. |
| EV-004 | fe | `src/components/pages/CoursesCatalogPage/component.tsx:44` | ui | The catalog owns search, view, pagination, owned/discover groups and settled notice states. |
| EV-005 | fe | `src/components/pages/CourseDetailPage/component.tsx:101` | ui | The detail page exposes overview/curriculum/reviews/FAQ data, pricing rail actions and pending/not-found/failed states. |
| EV-006 | fe | `src/components/pages/CartPage/component.tsx:39` | ui | The cart defines lines, totals, checkout and confirm-clear actions plus pending/ready/empty/failed states. |
| EV-007 | be | `src/features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.resolver.ts:65` | api | The authenticated coursesCheckout mutation starts one checkout for course ids, payment type and redirect URLs. |
