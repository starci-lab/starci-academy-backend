# Agency showcase and lead capture

> Business identity: `tedo/agency-showcase@27c907d726bc0ed10628a94bf6a4f5631e2e033be7370b8c411bc13bd92f749f`
>
> Source heads: `fe@8c9f46e075dd`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Vietnamese small-business buyers evaluate TEDO through a localized landing journey, compare services, indicative price ranges, delivery process and past projects, then start a consultation or submit a contact lead.

**Primary actor.** Prospective buyer

**Primary outcome.** A qualified prospective buyer reaches consultation or a delivered contact lead

**Never does.** Binding project quotation before discovery

## Invariants

- `BR-01` — The landing section order follows buyer questions: proof and fit precede services, price is exposed before detailed process, and contact closes the journey.
- `BR-02` — Published prices are indicative ranges rather than a fixed quote; the exact figure is deferred to discovery.
- `BR-03` — A contact lead requires name, email and message and fails explicitly when no delivery webhook is configured or the upstream rejects it.

## Primary flow

```text
showcase-ready → showcase-ready → lead-pending
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `agency-landing` | `/[locale]` | Answer a buyer's core trust, scope, budget, process and contact questions in one localized journey. | [surface](surfaces/agency-landing.md) |
| `projects-gallery` | `/[locale]/du-an` | Filter and inspect project cases before returning to contact. | [surface](surfaces/projects-gallery.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `POST /api/contact` | frontend | name, email, optional company, optional service, message | ok |

## Explicit unknowns

- `lead-response-time` — What response-time commitment is guaranteed after a contact submission? Impact: The surfaces provide contact channels and success/failure handling but do not establish a service-level promise.

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
