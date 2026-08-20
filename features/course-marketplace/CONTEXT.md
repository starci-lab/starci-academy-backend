# Course marketplace and checkout

> Business identity: `starci-academy/course-marketplace@794fad6a19c53e6baa94f7c20fa08953ac052e16c32cc7b24071c34215ccd149`
>
> Source heads: `fe@84bf3be6565a`, `be@0ed7b7bc8e1b`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Visitors discover localized courses, inspect curriculum and pricing evidence, collect courses in a personal cart, and start one authenticated checkout for the selected course set.

**Primary actor.** Learner

**Primary outcome.** The learner receives a checkout result for the selected course set

**Never does.** Payment-provider webhook settlement after checkout leaves the application

## Invariants

- `BR-01` — The catalog distinguishes pending, empty, filtered-empty, failed and populated states, and supports search, view and pagination controls.
- `BR-02` — The cart is viewer-owned, hides totals and checkout actions when empty or unreadable, and requires confirmation before clearing all lines.
- `BR-03` — Checkout requires authentication and creates one order with one line per submitted course.

## Primary flow

```text
marketplace-ready → marketplace-ready → checkout-pending
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `course-catalog` | `/[lang]/courses` | Find and compare courses. | [surface](surfaces/course-catalog.md) |
| `course-detail` | `/[lang]/courses/[displayId]` | Evaluate a course before enrollment. | [surface](surfaces/course-detail.md) |
| `shopping-cart` | `/[lang]/cart` | Review selected courses and totals before checkout. | [surface](surfaces/shopping-cart.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `coursesCheckout` | backend | course ids, payment type, redirect URLs | order and provider checkout data |

## Explicit unknowns

- `provider-return-shape` — Which payment-provider result fields should a prototype expose after coursesCheckout? Impact: The resolver confirms checkout ownership and inputs, but provider-specific return UI is not established by the cited marketplace surfaces.

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
