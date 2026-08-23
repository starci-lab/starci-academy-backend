# Public expert academy

> Business identity: `nivo/public-expert-academy@866a162d6dc8de3a31751be89172b05073cf5a5d5c32225a6f1eb16f7fbb8fb6`
>
> Source heads: `fe@97eec8c5bb4c`, `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** A public academy landing page renders expert-authored sections in their configured order, combines them with a public course catalogue, and accepts a visitor contact lead without requiring an account.

**Primary actor.** Academy visitor

**Primary outcome.** The public catalogue remains browsable without an account

**Never does.** Authenticated classroom and course consumption

## Invariants

- `BR-01` — Authored visible sections render in the expert's configured order; empty list-backed sections are omitted where the connected layer decides they have nothing to say.
- `BR-02` — The lead section is the only public section allowed to collect visitor data.

## Primary flow

```text
catalog-ready → catalog-empty → lead-idle → lead-sending
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `public-academy` | `/[locale]` | Turn an expert's configured story and course catalogue into a public discovery and lead-capture page. | [surface](surfaces/public-academy.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `courses` | backend | none | public ordered course catalogue |
| `submitLead` | backend | name, contact, optional message | lead ID |

## Explicit unknowns

- `classroom-entry` — What authenticated learner journey should the current Try free action enter? Impact: The public surface links toward sign-in, but this feature does not contain an implemented classroom journey.

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
